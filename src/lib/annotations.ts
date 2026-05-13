import type { UIIssue } from "@/lib/ai";
import { severityMeta } from "@/lib/design-system";

interface DrawOptions {
  activeIssueId?: string | null;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function drawAnnotations(
  context: CanvasRenderingContext2D,
  issues: UIIssue[],
  options: DrawOptions
) {
  const { activeIssueId, offsetX, offsetY, scale } = options;
  context.save();
  context.lineJoin = "round";
  context.font = "500 12px Inter, system-ui, sans-serif";

  issues.forEach((issue, index) => {
    const isActive = issue.id === activeIssueId;
    const color = isActive ? "#ff6b66" : severityMeta[issue.severity].marker;
    const x = offsetX + issue.bbox.x * scale;
    const y = offsetY + issue.bbox.y * scale;
    const width = issue.bbox.width * scale;
    const height = issue.bbox.height * scale;
    const label = `${index + 1}. ${issue.annotation_text}`;
    const tooltip = computeTooltip(context, label, x, y, width, height);

    context.strokeStyle = color;
    context.lineWidth = isActive ? 2.4 : 1.6;
    context.setLineDash(isActive ? [] : [6, 4]);
    context.strokeRect(x, y, width, height);
    context.setLineDash([]);

    drawArrow(context, color, tooltip.anchorX, tooltip.anchorY, tooltip.targetX, tooltip.targetY);
    drawTooltip(context, color, label, tooltip.x, tooltip.y, tooltip.width, tooltip.height);
  });

  context.restore();
}

export function hitTestIssue(
  issues: UIIssue[],
  point: { x: number; y: number },
  options: DrawOptions
): UIIssue | null {
  for (let index = issues.length - 1; index >= 0; index -= 1) {
    const issue = issues[index];
    const x = options.offsetX + issue.bbox.x * options.scale;
    const y = options.offsetY + issue.bbox.y * options.scale;
    const width = issue.bbox.width * options.scale;
    const height = issue.bbox.height * options.scale;

    if (point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height) {
      return issue;
    }
  }

  return null;
}

function computeTooltip(
  context: CanvasRenderingContext2D,
  label: string,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number
) {
  const paddingX = 10;
  const width = Math.min(260, Math.max(128, context.measureText(label).width + paddingX * 2));
  const height = 30;
  const targetX = boxX + boxWidth;
  const targetY = boxY + Math.min(22, boxHeight / 2);
  const canvasWidth = context.canvas.clientWidth || context.canvas.width;
  const canvasHeight = context.canvas.clientHeight || context.canvas.height;
  const x = targetX + 18 + width > canvasWidth ? boxX - width - 18 : targetX + 18;
  const y = Math.max(12, Math.min(boxY - 8, canvasHeight - height - 12));

  return {
    x,
    y,
    width,
    height,
    anchorX: x < targetX ? x + width : x,
    anchorY: y + height / 2,
    targetX,
    targetY
  };
}

function drawTooltip(
  context: CanvasRenderingContext2D,
  color: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  roundedRect(context, x, y, width, height, 6);
  context.fillStyle = "#fff";
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.stroke();
  context.fillStyle = color;
  context.fillText(label, x + 10, y + 19, width - 20);
}

function drawArrow(
  context: CanvasRenderingContext2D,
  color: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(toX - 8 * Math.cos(angle - Math.PI / 6), toY - 8 * Math.sin(angle - Math.PI / 6));
  context.lineTo(toX - 8 * Math.cos(angle + Math.PI / 6), toY - 8 * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
