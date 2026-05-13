import type { AIProviderConfig } from "@/lib/ai/types";

const provider = (process.env.AI_PROVIDER ?? "openai").trim();

const aiConfig: AIProviderConfig = {
  provider,
  apiKey: getApiKey(provider),
  model: (process.env.AI_MODEL ?? "gpt-4o").trim(),
  baseURL: (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").trim()
};

function getApiKey(provider: string): string {
  const normalizedProvider = provider.toLowerCase();
  const providerSpecificKeys: Record<string, Array<string | undefined>> = {
    openai: [process.env.OPENAI_API_KEY],
    moonshot: [process.env.MOONSHOT_API_KEY, process.env.KIMI_API_KEY],
    kimi: [process.env.KIMI_API_KEY, process.env.MOONSHOT_API_KEY],
    qwen: [process.env.QWEN_API_KEY, process.env.DASHSCOPE_API_KEY],
    dashscope: [process.env.DASHSCOPE_API_KEY, process.env.QWEN_API_KEY],
    doubao: [
      process.env.DOUBAO_API_KEY,
      process.env.ARK_API_KEY,
      process.env.VOLCENGINE_API_KEY
    ],
    volcengine: [
      process.env.VOLCENGINE_API_KEY,
      process.env.ARK_API_KEY,
      process.env.DOUBAO_API_KEY
    ]
  };

  return (
    [
      process.env.AI_API_KEY,
      ...(providerSpecificKeys[normalizedProvider] ?? []),
      process.env.OPENAI_API_KEY
    ].find((value) => value?.trim()) ?? ""
  ).trim();
}

export default aiConfig;
