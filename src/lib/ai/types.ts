export interface AIProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseURL: string;
}

export interface CompareUIDesignParams {
  designImage: string;
  implementationImage: string;
}

export type IssueSeverity = "严重" | "中等" | "轻微";

export interface UIBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UIIssue {
  id: string;
  type: string;
  severity: IssueSeverity;
  element: string;
  design_value: string;
  implementation_value: string;
  bbox: UIBoundingBox;
  annotation_text: string;
}

export interface CompareUIDesignResult {
  total_issues: number;
  issues: UIIssue[];
}
