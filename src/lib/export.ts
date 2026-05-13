import type { UIIssue } from "@/lib/ai/types";
import { drawAnnotations } from "@/lib/annotations";

export async function exportAnnotatedPng(imageSrc: string, issues: UIIssue[], fileName: string) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create export canvas.");
  }

  context.drawImage(image, 0, 0);
  drawAnnotations(context, issues, {
    activeIssueId: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1
  });

  const url = canvas.toDataURL("image/png");
  download(url, fileName);
}

export function exportMarkdown(issues: UIIssue[], fileName: string) {
  const markdown = generateMarkdownChecklist(issues);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  download(url, fileName);
  URL.revokeObjectURL(url);
}

export function generateMarkdownChecklist(issues: UIIssue[]): string {
  const groups = ["严重", "中等", "轻微"] as const;
  const lines = [
    "# UI 还原度走查修复清单",
    "",
    `共发现 ${issues.length} 个问题。坐标基于前端实现图。`,
    ""
  ];

  groups.forEach((severity) => {
    const groupIssues = issues.filter((issue) => issue.severity === severity);
    lines.push(`## ${severity} (${groupIssues.length})`, "");

    if (groupIssues.length === 0) {
      lines.push("- 无", "");
      return;
    }

    groupIssues.forEach((issue, index) => {
      lines.push(
        `${index + 1}. [${issue.type}] ${issue.element}`,
        `   - 问题：${issue.annotation_text}`,
        `   - 设计值：${issue.design_value}`,
        `   - 实现值：${issue.implementation_value}`,
        `   - 坐标：x ${Math.round(issue.bbox.x)}, y ${Math.round(issue.bbox.y)}, w ${Math.round(issue.bbox.width)}, h ${Math.round(issue.bbox.height)}`,
        `   - 修复建议：将实现侧 ${issue.element} 的${issue.type}调整为设计稿值，并复核相邻间距与状态样式。`,
        ""
      );
    });
  });

  return lines.join("\n");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load implementation image."));
    image.src = src;
  });
}

function download(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
