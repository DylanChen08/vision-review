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

    const endpoint = new URL("chat/completions", ensureTrailingSlash(this.config.baseURL));
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: UI_COMPARE_SYSTEM_PROMPT
          },
          {
            role: "user",
            content: [
              { type: "text", text: UI_COMPARE_USER_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: params.designImage,
                  detail: "high"
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: params.implementationImage,
                  detail: "high"
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
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
