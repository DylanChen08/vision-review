export const severityMeta = {
  严重: {
    label: "严重",
    tint: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/30",
    marker: "#ef4b44"
  },
  中等: {
    label: "中等",
    tint: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    marker: "#f6a524"
  },
  轻微: {
    label: "轻微",
    tint: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    marker: "#38bdf8"
  }
} as const;

export const analysisStages = [
  "校验画布尺寸",
  "对齐视觉结构",
  "识别颜色与间距差异",
  "生成设计标注",
  "整理修复清单"
];
