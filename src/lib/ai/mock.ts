import type { CompareUIDesignResult } from "@/lib/ai/types";

export function createMockCompareResult(): CompareUIDesignResult {
  const issues = [
    {
      id: "issue-1",
      type: "颜色",
      severity: "严重" as const,
      element: "主操作按钮",
      design_value: "#EDEFF3",
      implementation_value: "#C8D0DC",
      bbox: { x: 620, y: 156, width: 168, height: 42 },
      annotation_text: "按钮文字与背景对比不足"
    },
    {
      id: "issue-2",
      type: "位置",
      severity: "中等" as const,
      element: "数据卡片标题",
      design_value: "y: 284px",
      implementation_value: "y: 297px",
      bbox: { x: 188, y: 288, width: 220, height: 64 },
      annotation_text: "标题整体下移 13px"
    },
    {
      id: "issue-3",
      type: "圆角",
      severity: "轻微" as const,
      element: "右侧列表面板",
      design_value: "8px",
      implementation_value: "14px",
      bbox: { x: 832, y: 112, width: 260, height: 424 },
      annotation_text: "面板圆角偏大"
    }
  ];

  return {
    total_issues: issues.length,
    issues
  };
}
