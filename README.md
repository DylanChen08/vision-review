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

### DeepSeek

```env
AI_PROVIDER=deepseek
AI_API_KEY=...
AI_MODEL=deepseek-chat
AI_BASE_URL=https://api.deepseek.com/v1
```

### Moonshot / Kimi

```env
AI_PROVIDER=moonshot
AI_API_KEY=...
AI_MODEL=moonshot-v1-8k
AI_BASE_URL=https://api.moonshot.cn/v1
```

### 豆包 / 火山引擎

```env
AI_PROVIDER=doubao
AI_API_KEY=...
AI_MODEL=doubao-vision-pro
AI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

### 千问 DashScope

```env
AI_PROVIDER=qwen
AI_API_KEY=...
AI_MODEL=qwen-vl-plus
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
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
