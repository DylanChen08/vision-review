import aiConfig from "../../../ai.config";
import { OpenAICompatibleAdapter } from "@/lib/ai/openai-compatible";
import type { CompareUIDesignParams, CompareUIDesignResult } from "@/lib/ai/types";
import { createMockCompareResult } from "@/lib/ai/mock";

const adapter = new OpenAICompatibleAdapter(aiConfig);

export async function compareUIDesign(
  params: CompareUIDesignParams
): Promise<CompareUIDesignResult> {
  if (process.env.AI_ENABLE_MOCK === "true") {
    return createMockCompareResult();
  }

  return adapter.compareUIDesign(params);
}

export type {
  AIProviderConfig,
  CompareUIDesignParams,
  CompareUIDesignResult,
  UIIssue
} from "@/lib/ai/types";
