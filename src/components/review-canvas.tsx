"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CompareImageMeta, UIIssue } from "@/lib/ai/types";
import type { ImageRenderRect } from "@/lib/coordinates";
import { normalizedBoxToRenderBox } from "@/lib/coordinates";
import type { ImageAsset } from "@/lib/image";
import { drawAnnotations, hitTestIssue } from "@/lib/annotations";

interface ReviewCanvasProps {
  implementation: ImageAsset | null;
  issues: UIIssue[];
  imageMeta: CompareImageMeta | null;
  showCoordinateDebug: boolean;
  activeIssueId: string | null;
  onActiveIssueChange: (id: string | null) => void;
}

export function ReviewCanvas({
  implementation,
  issues,
  imageMeta,
  showCoordinateDebug,
  activeIssueId,
  onActiveIssueChange
}: ReviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    containerWidth: 0,
    containerHeight: 0,
    imageRenderRect: { left: 0, top: 0, width: 0, height: 0 } satisfies ImageRenderRect,
    devicePixelRatio: 1,
    scrollLeft: 0,
    scrollTop: 0
  });
  const [mouseDebug, setMouseDebug] = useState<{
    clientX: number;
    clientY: number;
    imageX: number;
    imageY: number;
    normalizedX: number;
    normalizedY: number;
  } | null>(null);

  const syncMetrics = useCallback(() => {
    const image = imageRef.current;
    const wrapper = wrapperRef.current;
    if (!image || !implementation) {
      return;
    }

    const imageRect = image.getBoundingClientRect();
    const wrapperRect = wrapper?.getBoundingClientRect() ?? imageRect;
    const nextMetrics = {
      containerWidth: wrapperRect.width,
      containerHeight: wrapperRect.height,
      imageRenderRect: {
        left: imageRect.left - wrapperRect.left,
        top: imageRect.top - wrapperRect.top,
        width: imageRect.width,
        height: imageRect.height
      },
      devicePixelRatio: window.devicePixelRatio || 1,
      scrollLeft: wrapper?.scrollLeft ?? 0,
      scrollTop: wrapper?.scrollTop ?? 0
    };

    setMetrics(nextMetrics);

    if (showCoordinateDebug && imageMeta) {
      console.table({
        originalWidth: imageMeta.originalWidth,
        originalHeight: imageMeta.originalHeight,
        modelInputWidth: imageMeta.modelInputWidth,
        modelInputHeight: imageMeta.modelInputHeight,
        previewNaturalWidth: image.naturalWidth,
        previewNaturalHeight: image.naturalHeight,
        previewClientWidth: imageRect.width,
        previewClientHeight: imageRect.height
      });
    }
  }, [imageMeta, implementation, showCoordinateDebug]);

  useEffect(() => {
    syncMetrics();
    window.addEventListener("resize", syncMetrics);
    return () => window.removeEventListener("resize", syncMetrics);
  }, [syncMetrics]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !implementation) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, metrics.containerWidth * dpr);
    canvas.height = Math.max(1, metrics.containerHeight * dpr);
    canvas.style.width = `${metrics.containerWidth}px`;
    canvas.style.height = `${metrics.containerHeight}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, metrics.containerWidth, metrics.containerHeight);
    drawAnnotations(context, issues, {
      activeIssueId,
      imageRenderRect: metrics.imageRenderRect
    });
  }, [activeIssueId, implementation, issues, metrics]);

  if (!implementation) {
    return (
      <div className="flex h-full min-h-[460px] items-center justify-center rounded-panel border border-dashed border-border bg-surface/45 xl:min-h-0">
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">等待实现图</p>
          <p className="mt-2 text-xs text-text-secondary">上传后将在这里显示可标注画布</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[460px] min-w-0 items-center justify-center overflow-auto rounded-panel border border-border bg-background p-5 shadow-surface xl:min-h-0">
      <div ref={wrapperRef} className="relative max-h-full max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={implementation.src}
          alt="前端实现图"
          className="block max-h-[calc(100vh-260px)] max-w-full rounded-input object-contain xl:max-h-full"
          onLoad={syncMetrics}
        />
        <canvas
          ref={canvasRef}
          className="absolute left-0 top-0 cursor-crosshair"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            const issue = hitTestIssue(
              issues,
              point,
              { activeIssueId, imageRenderRect: metrics.imageRenderRect }
            );
            const imageX = point.x - metrics.imageRenderRect.left;
            const imageY = point.y - metrics.imageRenderRect.top;
            if (showCoordinateDebug) {
              setMouseDebug({
                clientX: event.clientX,
                clientY: event.clientY,
                imageX,
                imageY,
                normalizedX: imageX / metrics.imageRenderRect.width,
                normalizedY: imageY / metrics.imageRenderRect.height
              });
            }
            onActiveIssueChange(issue?.id ?? activeIssueId);
          }}
          onMouseLeave={() => {
            setMouseDebug(null);
            onActiveIssueChange(null);
          }}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const issue = hitTestIssue(
              issues,
              { x: event.clientX - rect.left, y: event.clientY - rect.top },
              { activeIssueId, imageRenderRect: metrics.imageRenderRect }
            );
            onActiveIssueChange(issue?.id ?? null);
          }}
        />
        {showCoordinateDebug ? (
          <CoordinateDebugPanel
            implementation={implementation}
            issues={issues}
            activeIssueId={activeIssueId}
            imageMeta={imageMeta}
            metrics={metrics}
            mouseDebug={mouseDebug}
          />
        ) : null}
      </div>
    </div>
  );
}

function CoordinateDebugPanel({
  implementation,
  issues,
  activeIssueId,
  imageMeta,
  metrics,
  mouseDebug
}: {
  implementation: ImageAsset;
  issues: UIIssue[];
  activeIssueId: string | null;
  imageMeta: CompareImageMeta | null;
  metrics: {
    containerWidth: number;
    containerHeight: number;
    imageRenderRect: ImageRenderRect;
    devicePixelRatio: number;
    scrollLeft: number;
    scrollTop: number;
  };
  mouseDebug: {
    clientX: number;
    clientY: number;
    imageX: number;
    imageY: number;
    normalizedX: number;
    normalizedY: number;
  } | null;
}) {
  const activeIssue = issues.find((issue) => issue.id === activeIssueId) ?? issues[0] ?? null;
  const renderBox = activeIssue
    ? normalizedBoxToRenderBox(activeIssue.bbox, metrics.imageRenderRect)
    : null;

  return (
    <div className="pointer-events-none absolute left-3 top-3 max-w-[360px] rounded-input border border-border bg-background/90 p-3 text-[10px] leading-4 text-text-secondary shadow-surface backdrop-blur">
      <div className="mb-1 font-semibold text-text-primary">Coordinate Debug</div>
      <DebugRow label="original" value={`${imageMeta?.originalWidth ?? "-"}×${imageMeta?.originalHeight ?? "-"}`} />
      <DebugRow label="modelInput" value={`${imageMeta?.modelInputWidth ?? "-"}×${imageMeta?.modelInputHeight ?? "-"}`} />
      <DebugRow label="imageNatural" value={`${implementation.width}×${implementation.height}`} />
      <DebugRow label="container" value={`${round(metrics.containerWidth)}×${round(metrics.containerHeight)}`} />
      <DebugRow label="rendered" value={`${round(metrics.imageRenderRect.width)}×${round(metrics.imageRenderRect.height)}`} />
      <DebugRow label="renderOffset" value={`${round(metrics.imageRenderRect.left)}, ${round(metrics.imageRenderRect.top)}`} />
      <DebugRow label="scale" value={`${round(metrics.imageRenderRect.width / implementation.width)} / ${round(metrics.imageRenderRect.height / implementation.height)}`} />
      <DebugRow label="dpr" value={String(round(metrics.devicePixelRatio))} />
      <DebugRow label="scroll" value={`${round(metrics.scrollLeft)}, ${round(metrics.scrollTop)}`} />
      <DebugRow label="rawBox" value={activeIssue?.raw_bbox ? formatBox(activeIssue.raw_bbox) : "-"} />
      <DebugRow label="normalizedBox" value={activeIssue ? formatBox(activeIssue.bbox) : "-"} />
      <DebugRow label="renderBox" value={renderBox ? formatRenderBox(renderBox) : "-"} />
      <DebugRow label="mouse" value={mouseDebug ? `${round(mouseDebug.clientX)}, ${round(mouseDebug.clientY)}` : "-"} />
      <DebugRow label="imageXY" value={mouseDebug ? `${round(mouseDebug.imageX)}, ${round(mouseDebug.imageY)}` : "-"} />
      <DebugRow label="normalizedXY" value={mouseDebug ? `${round(mouseDebug.normalizedX)}, ${round(mouseDebug.normalizedY)}` : "-"} />
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
      <span>{label}</span>
      <span className="truncate font-mono text-text-primary">{value}</span>
    </div>
  );
}

function formatBox(box: { x: number; y: number; width: number; height: number }) {
  return `${round(box.x)}, ${round(box.y)}, ${round(box.width)}, ${round(box.height)}`;
}

function formatRenderBox(box: ImageRenderRect) {
  return `${round(box.left)}, ${round(box.top)}, ${round(box.width)}, ${round(box.height)}`;
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
