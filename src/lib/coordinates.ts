import type { NormalizedBox, UIBoundingBox } from "@/lib/ai/types";

export interface ImageRenderRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ScaledImageRenderRect extends ImageRenderRect {
  scale: number;
}

export interface BBoxXYXY {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function normalizedBoxToRenderBox(
  box: NormalizedBox,
  imageRenderRect: ImageRenderRect
): ImageRenderRect {
  return {
    left: imageRenderRect.left + box.x * imageRenderRect.width,
    top: imageRenderRect.top + box.y * imageRenderRect.height,
    width: box.width * imageRenderRect.width,
    height: box.height * imageRenderRect.height
  };
}

export function normalizePixelBox(
  box: UIBoundingBox,
  imageSize: { width: number; height: number }
): NormalizedBox {
  return clampBox({
    x: box.x / imageSize.width,
    y: box.y / imageSize.height,
    width: box.width / imageSize.width,
    height: box.height / imageSize.height
  });
}

export function clampBox(box: NormalizedBox): NormalizedBox {
  const x = clamp01(box.x);
  const y = clamp01(box.y);
  const width = Math.max(0, Math.min(1 - x, box.width));
  const height = Math.max(0, Math.min(1 - y, box.height));

  return { x, y, width, height };
}

export function xyxyToXywh(box: BBoxXYXY): UIBoundingBox {
  return {
    x: box.x1,
    y: box.y1,
    width: box.x2 - box.x1,
    height: box.y2 - box.y1
  };
}

export function getContainedImageRect(params: {
  containerWidth: number;
  containerHeight: number;
  naturalWidth: number;
  naturalHeight: number;
}): ScaledImageRenderRect {
  const scale = Math.min(
    params.containerWidth / params.naturalWidth,
    params.containerHeight / params.naturalHeight
  );
  const width = params.naturalWidth * scale;
  const height = params.naturalHeight * scale;

  return {
    left: (params.containerWidth - width) / 2,
    top: (params.containerHeight - height) / 2,
    width,
    height,
    scale
  };
}

export function getCoveredImageRect(params: {
  containerWidth: number;
  containerHeight: number;
  naturalWidth: number;
  naturalHeight: number;
}): ScaledImageRenderRect {
  const scale = Math.max(
    params.containerWidth / params.naturalWidth,
    params.containerHeight / params.naturalHeight
  );
  const width = params.naturalWidth * scale;
  const height = params.naturalHeight * scale;

  return {
    left: (params.containerWidth - width) / 2,
    top: (params.containerHeight - height) / 2,
    width,
    height,
    scale
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
