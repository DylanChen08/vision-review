export interface AIProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseURL: string;
}

export interface CompareUIDesignParams {
  designImage: string;
  implementationImage: string;
  imageMeta: CompareImageMeta;
}

export type IssueSeverity = "严重" | "中等" | "轻微";
export type CoordinateType = "pixel" | "normalized";

export interface UIBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type NormalizedBox = UIBoundingBox;

export interface CompareImageMeta {
  originalWidth: number;
  originalHeight: number;
  modelInputWidth: number;
  modelInputHeight: number;
  coordinateType: CoordinateType;
}

export interface UIIssue {
  id: string;
  type: string;
  severity: IssueSeverity;
  element: string;
  design_value: string;
  implementation_value: string;
  bbox: NormalizedBox;
  raw_bbox?: UIBoundingBox;
  annotation_text: string;
}

export interface CompareUIDesignResult {
  imageMeta: CompareImageMeta;
  total_issues: number;
  issues: UIIssue[];
}
