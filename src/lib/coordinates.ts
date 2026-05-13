import type { UIIssue } from "@/lib/ai/types";
import type { ImageAsset } from "@/lib/image";

export function normalizeIssueCoordinates(
  issues: UIIssue[],
  design: ImageAsset,
  implementation: ImageAsset
): UIIssue[] {
  if (usesImplementationCoordinates(issues, design, implementation)) {
    return issues;
  }

  const scaleX = implementation.width / design.width;
  const scaleY = implementation.height / design.height;

  return issues.map((issue) => ({
    ...issue,
    bbox: {
      x: issue.bbox.x * scaleX,
      y: issue.bbox.y * scaleY,
      width: issue.bbox.width * scaleX,
      height: issue.bbox.height * scaleY
    }
  }));
}

function usesImplementationCoordinates(
  issues: UIIssue[],
  design: ImageAsset,
  implementation: ImageAsset
) {
  if (design.width === implementation.width && design.height === implementation.height) {
    return true;
  }

  const designToImplementationScaleX = implementation.width / design.width;
  const designToImplementationScaleY = implementation.height / design.height;
  const implementationIsScaledUp =
    designToImplementationScaleX > 1.05 && designToImplementationScaleY > 1.05;

  if (!implementationIsScaledUp) {
    return true;
  }

  return issues.some((issue) => {
    const right = issue.bbox.x + issue.bbox.width;
    const bottom = issue.bbox.y + issue.bbox.height;
    return right > design.width || bottom > design.height;
  });
}
