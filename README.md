# Vision Review

面向设计师的 UI 还原度一键走查工具。产品目标是把视觉模型对比结果转成可交付给开发修复的结构化标注，而不是普通聊天式 AI Demo。

## 功能

- 双图上传：设计稿与前端实现图
- 自动尺寸校验与预览
- 服务端 AI 视觉对比，输出严格 JSON
- Canvas 标注层：红色问题框、箭头、白底红字 Tooltip、Hover 高亮、点击聚焦
- 右侧问题清单：严重 / 中等 / 轻微分类
- 删除单个标注
- 导出带标注 PNG
- 导出 Markdown 修复清单
- 深色科技风设计系统：颜色、字体、间距、圆角、阴影 token

## 模型配置

模型集中配置在根目录 `ai.config.ts` 的 `AI_MODEL_PRESETS` 中。日常切换模型只需要改一个字段：

```env
AI_MODEL_PRESET=openai
```

支持的预设：

| preset | provider | 默认模型 | 默认 Base URL | Key 环境变量 |
| --- | --- | --- | --- | --- |
| `openai` | OpenAI | `gpt-4o` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `moonshot` | Moonshot / Kimi | `kimi-k2.5` | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY` |
| `doubao` | 豆包 / 火山引擎 | `doubao-vision-pro` | `https://ark.cn-beijing.volces.com/api/v3` | `DOUBAO_API_KEY` |
| `qwen` | 通义千问 DashScope | `qwen-vl-plus` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `QWEN_API_KEY` |

实际代码中 `apiKey` 会从环境变量读取，不会暴露给前端。模型调用统一经过 `src/app/api/compare/route.ts` 与 `src/lib/ai` adapter。

如需临时覆盖预设，可额外设置：

```env
AI_MODEL=
AI_BASE_URL=
AI_API_KEY=
```

通常建议优先使用 provider 专用 Key，例如 `OPENAI_API_KEY`、`MOONSHOT_API_KEY`，避免不同厂商 Key 混用。

### OpenAI

```env
AI_MODEL_PRESET=openai
OPENAI_API_KEY=sk-...
```

### DeepSeek（当前不可用）

DeepSeek 官方说明 **V4 API 为纯文本**；`https://api.deepseek.com/v1` 的 Chat Completions **不接受** OpenAI 式的 `image_url` 图片块，因此**无法用于本项目的双图视觉走查**（会出现 `unknown variant image_url`）。若通过 OpenRouter 等第三方聚合且对方支持多模态，可改用该服务的 `AI_BASE_URL` 与对应模型名。

### Moonshot / Kimi（视觉）

使用 **Kimi 视觉模型** 时 Base URL 通常为 `https://api.moonshot.cn/v1`；如果你的账号在国际站生成 Key，再按控制台文档改为对应域名。仅支持 **base64 的 `data:image/...` 图片**（本应用上传已满足）；不支持纯 HTTP 外链图。

推荐多模态：`kimi-k2.5`、`kimi-k2.6`；传统 vision 预览：`moonshot-v1-8k-vision-preview` 等。

```env
AI_MODEL_PRESET=moonshot
MOONSHOT_API_KEY=（在 https://platform.moonshot.ai 控制台创建，与 DeepSeek 密钥不可混用）
```

### 豆包 / 火山引擎

```env
AI_MODEL_PRESET=doubao
DOUBAO_API_KEY=...
```

### 千问 DashScope

```env
AI_MODEL_PRESET=qwen
QWEN_API_KEY=...
```

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

没有 API Key 时可以在本地调试时启用 mock：

```env
AI_ENABLE_MOCK=true
```

## 工程结构

```text
src/app/api/compare     服务端 AI 对比入口
src/lib/ai              AI 类型、提示词、schema、adapter
src/lib/annotations.ts  Canvas 标注绘制与命中测试
src/lib/export.ts       PNG / Markdown 导出
src/components          上传、Loading、画布、问题面板
```

## 校验

```bash
npm run typecheck
npm run lint
npm run build
```
