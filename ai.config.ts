import type { AIProviderConfig } from "@/lib/ai/types";

type AIModelPresetKey = "openai" | "moonshot" | "doubao" | "qwen";

interface AIModelPreset {
  provider: string;
  model: string;
  baseURL: string;
  apiKeyEnvVars: string[];
}

const AI_MODEL_PRESETS: Record<AIModelPresetKey, AIModelPreset> = {
  openai: {
    provider: "openai",
    model: "gpt-4o",
    baseURL: "https://api.openai.com/v1",
    apiKeyEnvVars: ["OPENAI_API_KEY"]
  },
  moonshot: {
    provider: "moonshot",
    model: "kimi-k2.6",
    baseURL: "https://api.moonshot.cn/v1",
    apiKeyEnvVars: ["MOONSHOT_API_KEY", "KIMI_API_KEY"]
  },
  doubao: {
    provider: "doubao",
    model: "doubao-vision-pro",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    apiKeyEnvVars: ["DOUBAO_API_KEY", "ARK_API_KEY", "VOLCENGINE_API_KEY"]
  },
  qwen: {
    provider: "qwen",
    model: "qwen-vl-plus",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKeyEnvVars: ["QWEN_API_KEY", "DASHSCOPE_API_KEY"]
  }
};

const presetKey = getPresetKey(process.env.AI_MODEL_PRESET ?? process.env.AI_PROVIDER);
const preset = AI_MODEL_PRESETS[presetKey];

const aiConfig: AIProviderConfig = {
  provider: (process.env.AI_PROVIDER ?? preset.provider).trim(),
  apiKey: getApiKey(preset),
  model: (process.env.AI_MODEL ?? preset.model).trim(),
  baseURL: (process.env.AI_BASE_URL ?? preset.baseURL).trim()
};

function getPresetKey(value: string | undefined): AIModelPresetKey {
  const normalized = value?.trim().toLowerCase();

  if (normalized && normalized in AI_MODEL_PRESETS) {
    return normalized as AIModelPresetKey;
  }

  return "openai";
}

function getApiKey(preset: AIModelPreset): string {
  return (
    [
      ...preset.apiKeyEnvVars.map((envVar) => process.env[envVar]),
      process.env.AI_API_KEY
    ].find((value) => value?.trim()) ?? ""
  ).trim();
}

export default aiConfig;
