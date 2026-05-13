import { compareResultSchema } from "@/lib/ai/schema";
import type {
  AIProviderConfig,
  CompareUIDesignParams,
  CompareUIDesignResult
} from "@/lib/ai/types";
import { parseStrictJson } from "@/lib/ai/json";
import { UI_COMPARE_SYSTEM_PROMPT, UI_COMPARE_USER_PROMPT } from "@/lib/ai/prompts";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenAICompatibleAdapter {
  constructor(private readonly config: AIProviderConfig) {}

  async compareUIDesign(params: CompareUIDesignParams): Promise<CompareUIDesignResult> {
    if (!this.config.apiKey) {
      throw new Error("AI API key is missing. Set AI_API_KEY or provider-specific env vars.");
    }

    if (isDeepSeekOpenAiCompatibleHost(this.config.baseURL)) {
      throw new Error(
        "DeepSeek 官方 API（api.deepseek.com）的 Chat Completions 目前仅接受纯文本，无法在请求中附带图片（会报 unknown variant image_url）。本应用需要支持 OpenAI 式 image_url 的视觉模型。请改用 README 中的 OpenAI（如 gpt-4o）、通义千问 Qwen-VL、豆包多模态等；本地调试可设 AI_ENABLE_MOCK=true。"
      );
    }

    const endpoint = new URL("chat/completions", ensureTrailingSlash(this.config.baseURL));
    const moonshotHost = isMoonshotHost(this.config.baseURL);
    const kimiK2FixedParams = moonshotHost && isKimiK2DotXModel(this.config.model);

    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: string } }
    > = [
      { type: "text", text: UI_COMPARE_USER_PROMPT },
      {
        type: "image_url",
        image_url: moonshotHost
          ? { url: params.designImage }
          : { url: params.designImage, detail: "high" }
      },
      {
        type: "image_url",
        image_url: moonshotHost
          ? { url: params.implementationImage }
          : { url: params.implementationImage, detail: "high" }
      }
    ];

    const requestBody: Record<string, unknown> = {
      model: this.config.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: UI_COMPARE_SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ]
    };

    // Moonshot Kimi K2.5/K2.6：官方文档要求 temperature 等为固定值，传入自定义值会报错
    if (!kimiK2FixedParams) {
      requestBody.temperature = 0.1;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `AI provider authentication failed (${response.status}) for ${this.config.provider} at ${endpoint.origin}. Check that the API key belongs to this provider and has not expired. Provider response: ${errorText}`
        );
      }

      throw new Error(`AI provider request failed (${response.status}): ${errorText}`);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI provider returned an empty response.");
    }

    const parsed = parseStrictJson<CompareUIDesignResult>(content);
    const normalized = {
      ...parsed,
      total_issues: parsed.issues.length
    };

    return compareResultSchema.parse(normalized);
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

/** DeepSeek 文档说明 V4 API 为 text-only；OpenAI 兼容端不接受 user 消息里的 image_url。 */
function isDeepSeekOpenAiCompatibleHost(baseURL: string): boolean {
  return baseURL.toLowerCase().includes("api.deepseek.com");
}

function isMoonshotHost(baseURL: string): boolean {
  const lowerBaseURL = baseURL.toLowerCase();
  return lowerBaseURL.includes("api.moonshot.ai") || lowerBaseURL.includes("api.moonshot.cn");
}

/** Kimi K2.5 / K2.6 等：temperature 等采样参数由服务端固定，不可自定义。 */
function isKimiK2DotXModel(model: string): boolean {
  const m = model.trim().toLowerCase();
  return m.startsWith("kimi-k2");
}
