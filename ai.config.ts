import type { AIProviderConfig } from "@/lib/ai/types";

const aiConfig: AIProviderConfig = {
  provider: process.env.AI_PROVIDER ?? "openai",
  apiKey: process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  model: process.env.AI_MODEL ?? "gpt-4o",
  baseURL: process.env.AI_BASE_URL ?? "https://api.openai.com/v1"
};

export default aiConfig;
