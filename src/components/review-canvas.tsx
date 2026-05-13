"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UIIssue } from "@/lib/ai/types";
import type { ImageAsset } from "@/lib/image";
import { drawAnnotations, hitTestIssue } from "@/lib/annotations";

interface ReviewCanvasProps {
  implementation: ImageAsset | null;
  issues: UIIssue[];
  activeIssueId: string | null;
  onActiveIssueChange: (id: string | null) => void;
}

export function ReviewCanvas({
  implementation,
  issues,
  activeIssueId,
  onActiveIssueChange
}: ReviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [metrics, setMetrics] = useState({ width: 0, height: 0, scale: 1 });

  const syncMetrics = useCallback(() => {
    const image = imageRef.current;
    if (!image || !implementation) {
      return;
    }

    const rect = image.getBoundingClientRect();
    setMetrics({
      width: rect.width,
      height: rect.height,
      scale: rect.width / implementation.width
    });
  }, [implementation]);

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
    canvas.width = Math.max(1, metrics.width * dpr);
    canvas.height = Math.max(1, metrics.height * dpr);
    canvas.style.width = `${metrics.width}px`;
    canvas.style.height = `${metrics.height}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, metrics.width, metrics.height);
    drawAnnotations(context, issues, {
      activeIssueId,
      offsetX: 0,
      offsetY: 0,
      scale: metrics.scale
    });
  }, [activeIssueId, implementation, issues, metrics]);

  if (!implementation) {
    return (
      <div className="flex h-full min-h-[460px] items-center justify-center rounded-panel border border-dashed border-border bg-surface/45">
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">等待实现图</p>
          <p className="mt-2 text-xs text-text-secondary">上传后将在这里显示可标注画布</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[460px] items-center justify-center overflow-auto rounded-panel border border-border bg-[#05070b] p-5 shadow-surface">
      <div className="relative max-h-full max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={implementation.src}
          alt="前端实现图"
          className="block max-h-[calc(100vh-260px)] max-w-full rounded-input object-contain"
          onLoad={syncMetrics}
        />
        <canvas
          ref={canvasRef}
          className="absolute left-0 top-0 cursor-crosshair"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const issue = hitTestIssue(
              issues,
              { x: event.clientX - rect.left, y: event.clientY - rect.top },
              { activeIssueId, offsetX: 0, offsetY: 0, scale: metrics.scale }
            );
            onActiveIssueChange(issue?.id ?? activeIssueId);
          }}
          onMouseLeave={() => onActiveIssueChange(null)}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const issue = hitTestIssue(
              issues,
              { x: event.clientX - rect.left, y: event.clientY - rect.top },
              { activeIssueId, offsetX: 0, offsetY: 0, scale: metrics.scale }
            );
            onActiveIssueChange(issue?.id ?? null);
          }}
        />
      </div>
    </div>
  );
}
