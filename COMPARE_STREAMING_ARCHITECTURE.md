# Vision Review `/compare` 流式化前后端架构草案

> 目的：整理本项目可借鉴的流式架构思路，方便后续用 ChatGPT 或绘图工具生成流程图。本文是架构草案，不代表当前项目已经实现。

## 1. 项目背景

Vision Review 是一个设计稿还原度走查工具。用户上传两张图片：

- 设计稿截图
- 前端实现截图

后端调用视觉模型比较两张图片，输出结构化问题列表。前端把问题展示为：

- 右侧问题清单
- Canvas 上的红框标注
- Tooltip 和导出内容

当前链路是一次性返回：前端调用 `/api/compare`，等待模型返回完整 JSON，后端解析完成后一次性响应。问题是视觉模型响应较慢，用户需要等待完整结果返回后才能看到任何分析内容。

## 2. 可借鉴的核心思想

参考流程图中的设计，最值得借鉴的不是“生成 React UI 树”，而是以下流式处理思想：

1. 后端不要直接把模型原始 token 透传给前端。
2. 后端负责把模型输出转换成稳定协议。
3. 协议使用 SSE 或 JSONL，一条消息代表一个完整动作。
4. 前端使用 Buffer 拼接不完整 chunk，拿到完整消息后再解析。
5. 前端按动作类型更新运行时状态，而不是等最终大 JSON。
6. 前端渲染需要节流，避免每个 chunk 都触发 Canvas 和列表重绘。
7. 最终完成时仍然要做完整 schema 校验，保证导出和后续操作使用的是稳定数据。

## 3. 推荐总体链路

```text
用户上传两张图片
  -> 前端调用 /api/compare/stream
  -> 后端组装视觉模型 messages
  -> 后端调用支持 stream 的视觉模型
  -> 后端解析模型输出
  -> 后端转换为 Compare Stream Protocol
  -> 后端通过 SSE 逐条发送事件
  -> 前端接收 SSE chunk
  -> 前端写入 JSONLBuffer
  -> 前端解析完整事件
  -> 前端更新 issues、summary、analysisStatus
  -> 前端节流触发列表和 Canvas 渲染
  -> done 后启用导出、删除标注、Markdown 清单等完整功能
```

## 4. 后端架构

### 4.1 接口层

建议保留当前一次性接口：

```text
POST /api/compare
```

用于兼容现有逻辑、调试、降级和不支持流式的模型。

新增流式接口：

```text
POST /api/compare/stream
```

职责：

- 接收设计稿图片和实现截图。
- 校验请求体。
- 调用视觉模型。
- 把模型输出转换成稳定事件。
- 通过 SSE 返回。

### 4.2 模型调用层

模型调用层负责：

- 根据 `AI_PROVIDER`、`AI_MODEL`、`AI_BASE_URL`、API Key 选择 provider。
- 组装 system prompt。
- 组装用户消息，包括两张 `data:image/...` 图片。
- 开启模型 stream。
- 接收模型返回的增量文本。

注意：不同模型的 stream 格式不同，因此 provider adapter 内部需要把差异统一成一种内部 token 流。

### 4.3 模型输出解析层

不要要求前端直接解析模型原文。后端应该把模型原文解析成内部结构：

```text
LLM 原始 stream
  -> token buffer
  -> JSONL 行解析
  -> 单条 compare action
  -> schema 校验
  -> SSE event
```

如果模型不能稳定输出 JSONL，可以采用两层策略：

- 第一层：模型输出尽量约束为 JSONL。
- 第二层：后端 Buffer 累积并尝试修复或丢弃不完整片段。

### 4.4 协议转换层

后端向前端发送的事件不应该是模型原文，而应该是业务动作。推荐命名为：

```text
Compare Stream Protocol
```

它把模型输出转换成以下动作：

- `analysis_started`
- `analysis_status`
- `issue_found`
- `issue_refined`
- `summary_update`
- `done`
- `error`

## 5. SSE 事件协议

### 5.1 SSE 格式

推荐使用标准 SSE：

```text
event: compare
data: {"type":"issue_found","payload":{...}}

event: compare
data: {"type":"summary_update","payload":{...}}

event: compare
data: {"type":"done","payload":{...}}
```

也可以使用 `event` 区分动作类型：

```text
event: issue_found
data: {...}
```

为了前端实现简单，推荐统一 `event: compare`，在 `data.type` 里区分动作。

### 5.2 事件类型

#### analysis_started

表示后端已经开始处理请求。

```json
{
  "type": "analysis_started",
  "payload": {
    "requestId": "cmp_20260513_001",
    "model": "kimi-k2.5"
  }
}
```

#### analysis_status

表示当前分析阶段，用于更新加载文案和进度状态。

```json
{
  "type": "analysis_status",
  "payload": {
    "stage": "scanning_layout",
    "message": "正在检查布局、间距和对齐问题"
  }
}
```

可选阶段：

- `upload_received`
- `validating_images`
- `scanning_layout`
- `checking_visual_differences`
- `locating_issues`
- `building_annotations`
- `finalizing`

#### issue_found

表示发现一个问题。这个事件可以先包含文字信息，也可以包含 bbox。

```json
{
  "type": "issue_found",
  "payload": {
    "issue": {
      "id": "issue_001",
      "type": "spacing",
      "severity": "中等",
      "element": "顶部导航按钮",
      "design_value": "按钮间距 16px",
      "implementation_value": "按钮间距约 8px",
      "bbox": null,
      "annotation_text": "按钮间距偏小"
    }
  }
}
```

前端收到后可以先展示右侧问题清单。如果 `bbox` 是 `null`，Canvas 上暂时不画框，展示“定位中”状态。

#### issue_refined

表示补充或修正某个问题，常用于后续补充 bbox、修正文案或 severity。

```json
{
  "type": "issue_refined",
  "payload": {
    "issueId": "issue_001",
    "patch": {
      "bbox": {
        "x": 128,
        "y": 64,
        "width": 180,
        "height": 42
      }
    }
  }
}
```

前端收到后合并到已有 issue，并触发 Canvas 标注绘制。

#### summary_update

表示阶段性统计。

```json
{
  "type": "summary_update",
  "payload": {
    "knownIssues": 5,
    "severityCount": {
      "严重": 1,
      "中等": 3,
      "轻微": 1
    }
  }
}
```

#### done

表示模型输出结束，后端已完成最终校验。

```json
{
  "type": "done",
  "payload": {
    "result": {
      "total_issues": 5,
      "issues": []
    }
  }
}
```

`done.payload.result` 应该符合当前项目的 `CompareUIDesignResult` schema。

#### error

表示流式过程中出现错误。

```json
{
  "type": "error",
  "payload": {
    "message": "AI provider authentication failed",
    "recoverable": false
  }
}
```

## 6. 前端架构

### 6.1 前端整体链路

```text
用户点击开始分析
  -> 设置 analysisStatus = running
  -> 打开 SSE 或 fetch stream
  -> consumeCompareStream
  -> JSONLBuffer 拼接 chunk
  -> parseCompareEvent
  -> compareReducer 更新状态
  -> scheduleRender 节流
  -> IssuePanel 渲染问题列表
  -> ReviewCanvas 渲染 bbox 标注
  -> done 后进入 complete 状态
```

### 6.2 前端状态模型

建议把前端状态拆成以下几部分：

```ts
type CompareRuntimeState = {
  status: "idle" | "running" | "complete" | "error";
  stage?: string;
  message?: string;
  issues: UIIssue[];
  pendingIssueIds: string[];
  summary: {
    knownIssues: number;
    severityCount: Record<string, number>;
  };
  finalResult?: CompareUIDesignResult;
  error?: string;
};
```

核心思想：

- `issues` 可以增量更新。
- `pendingIssueIds` 表示还没有 bbox 或信息不完整的问题。
- `finalResult` 只有 `done` 后才存在。
- 导出功能应该优先使用 `finalResult`，避免导出半成品。

### 6.3 Buffer 和 Parser

前端不能假设每次收到的 chunk 都是完整 JSON。需要一个 Buffer：

```text
SSE chunk
  -> append 到 buffer
  -> 按换行或 SSE data 边界切分
  -> 只解析完整消息
  -> 不完整片段留在 buffer
```

如果使用标准 SSE，浏览器 `EventSource` 会帮忙处理事件边界。但如果用 `fetch` 读取 `ReadableStream`，就需要自己实现 Buffer。

### 6.4 Reducer 按动作更新状态

前端不要把所有事件写成散落的 `setState`。建议统一 reducer：

```text
analysis_started -> 初始化运行状态
analysis_status  -> 更新 stage 和 message
issue_found      -> 插入新 issue
issue_refined    -> patch 已有 issue
summary_update   -> 更新统计信息
done             -> 写入 finalResult，状态改为 complete
error            -> 状态改为 error
```

### 6.5 渲染节流

如果模型快速输出多个问题，前端应合并更新，避免频繁重绘 Canvas。

推荐策略：

- 问题列表可以较快更新。
- Canvas 标注使用 `requestAnimationFrame` 或 50-100ms 节流。
- `issue_refined` 补 bbox 时再触发 Canvas 重绘。

## 7. UI 展示策略

### 7.1 运行中状态

开始分析后立即展示：

- 两张图片预览
- 当前阶段文案
- 已发现问题数量
- 正在定位中的问题

### 7.2 问题先出现，标注后补齐

对于没有 bbox 的 issue：

- 右侧列表先展示问题文案。
- 列表项显示“定位中”状态。
- Canvas 不画框，或画一个轻量 loading 标记。

当 `issue_refined` 带 bbox 到达后：

- 更新列表项状态。
- Canvas 绘制红框。
- Hover 和点击聚焦逻辑恢复可用。

### 7.3 完成后状态

收到 `done` 后：

- 使用最终 `CompareUIDesignResult` 覆盖或校准运行时状态。
- 启用导出 PNG。
- 启用导出 Markdown 修复清单。
- 允许删除单个标注。

## 8. 错误和降级

### 8.1 模型不支持 stream

如果 provider 不支持 stream：

```text
前端调用 /api/compare/stream
  -> 后端发现不支持
  -> 后端发送 analysis_status
  -> 后端内部调用一次性 compare
  -> 完成后只发送 done
```

这样前端仍然使用同一套消费逻辑。

### 8.2 JSONL 解析失败

后端应尽量不要把无效事件发给前端。可选策略：

- 丢弃无法解析的中间片段。
- 记录服务端日志。
- 如果连续失败，发送 `error`。
- 降级为等待完整模型输出后再返回 `done`。

### 8.3 网络中断

前端需要处理：

- SSE 断开。
- 用户取消分析。
- 请求超时。

建议状态：

- `cancelled`
- `timeout`
- `provider_error`
- `parse_error`

## 9. 和当前项目的映射关系

当前项目已有模块可以这样映射：

```text
src/app/api/compare/route.ts
  -> 保留为一次性 compare 接口

src/app/api/compare/stream/route.ts
  -> 新增流式 compare 接口

src/lib/ai/openai-compatible.ts
  -> 增加 streamCompareUIDesign 方法

src/lib/ai/schema.ts
  -> 增加 stream event schema

src/lib/ai/prompts.ts
  -> 增加 JSONL / incremental issue prompt

src/components/analysis-loader.tsx
  -> 展示 analysis_status 和阶段信息

src/components/issue-panel.tsx
  -> 支持 issue 增量出现和 pending bbox 状态

src/components/review-canvas.tsx
  -> 支持只有 bbox 的 issue 才绘制标注

src/lib/export.ts
  -> 仍然基于 done 后的 finalResult 导出
```

## 10. 建议流程图节点

### 后端节点

1. 接收 `/api/compare/stream` 请求
2. 校验两张图片和请求参数
3. 组装视觉模型 messages
4. 调用支持 stream 的模型 adapter
5. 接收 LLM 原始 token
6. 写入服务端 token buffer
7. 解析 JSONL 或结构化片段
8. 校验 compare action schema
9. 转换为 Compare Stream Protocol
10. 通过 SSE 发送事件
11. 累积最终 issues
12. 完成最终 schema 校验
13. 发送 `done`
14. 异常时发送 `error`

### 前端节点

1. 用户上传设计稿和实现截图
2. 点击开始分析
3. 初始化运行时状态
4. 建立 SSE 或 fetch stream 连接
5. 接收 SSE chunk
6. 写入 JSONLBuffer
7. 解析完整 compare event
8. 按事件类型进入 reducer
9. `analysis_status` 更新阶段文案
10. `issue_found` 插入问题列表
11. `issue_refined` 合并 bbox
12. `summary_update` 更新统计信息
13. 节流调度渲染
14. IssuePanel 增量展示问题
15. ReviewCanvas 绘制已有 bbox 的标注
16. `done` 写入最终结果
17. 启用 PNG 和 Markdown 导出
18. `error` 展示错误并允许重试

## 11. 简化版流程图文案

```text
后端：
请求进入 -> 参数校验 -> 组装视觉模型消息 -> 调用 LLM stream -> 接收 token -> Buffer 拼接 -> 解析 JSONL -> 校验 action -> 转成业务事件 -> SSE 推送 -> 累积最终结果 -> done/error

前端：
开始分析 -> 建立 stream -> 接收 chunk -> Buffer 拼接 -> 解析事件 -> reducer 更新状态 -> 问题列表先展示 -> bbox 到达后绘制 Canvas 标注 -> 节流渲染 -> done 后启用导出
```

## 12. 核心结论

这个项目最适合借鉴的架构不是完整 A2UI 或 React TreeBuild，而是：

- 后端协议转换
- SSE 增量推送
- JSONL 或 action-based event
- 前端 Buffer
- reducer 驱动运行时状态
- 节流渲染
- 最终 schema 校验

最终目标是让用户在模型完整返回前，先看到已经发现的问题；等 bbox 和最终校验完成后，再进入完整可导出的结果状态。
