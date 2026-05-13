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

只需要修改根目录 `ai.config.ts` 或对应环境变量即可切换模型。

```ts
export default {
  provider: "openai",
  apiKey: process.env.AI_API_KEY,
  model: "gpt-4o",
  baseURL: "https://api.openai.com/v1"
}
```

实际代码中 `apiKey` 会从环境变量读取，不会暴露给前端。模型调用统一经过 `src/app/api/compare/route.ts` 与 `src/lib/ai` adapter。

### OpenAI

```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o
AI_BASE_URL=https://api.openai.com/v1
```

### DeepSeek（当前不可用）

DeepSeek 官方说明 **V4 API 为纯文本**；`https://api.deepseek.com/v1` 的 Chat Completions **不接受** OpenAI 式的 `image_url` 图片块，因此**无法用于本项目的双图视觉走查**（会出现 `unknown variant image_url`）。若通过 OpenRouter 等第三方聚合且对方支持多模态，可改用该服务的 `AI_BASE_URL` 与对应模型名。

### Moonshot / Kimi（视觉）

使用 **Kimi 视觉模型** 时 Base URL 通常为 `https://api.moonshot.cn/v1`；如果你的账号在国际站生成 Key，再按控制台文档改为对应域名。仅支持 **base64 的 `data:image/...` 图片**（本应用上传已满足）；不支持纯 HTTP 外链图。

推荐多模态：`kimi-k2.5`、`kimi-k2.6`；传统 vision 预览：`moonshot-v1-8k-vision-preview` 等。

```env
AI_PROVIDER=moonshot
MOONSHOT_API_KEY=（在 https://platform.moonshot.ai 控制台创建，与 DeepSeek 密钥不可混用）
AI_MODEL=kimi-k2.5
AI_BASE_URL=https://api.moonshot.cn/v1
```

### 豆包 / 火山引擎

```env
AI_PROVIDER=doubao
DOUBAO_API_KEY=...
AI_MODEL=doubao-vision-pro
AI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

### 千问 DashScope

```env
AI_PROVIDER=qwen
QWEN_API_KEY=...
AI_MODEL=qwen-vl-plus
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

`AI_API_KEY` 仍可作为通用覆盖项；如果同时设置，会优先使用 `AI_API_KEY`。

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
