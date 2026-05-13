"use client";

import { motion } from "framer-motion";
import { analysisStages } from "@/lib/design-system";

interface AnalysisLoaderProps {
  progress: number;
  stageIndex: number;
}

export function AnalysisLoader({ progress, stageIndex }: AnalysisLoaderProps) {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden rounded-panel border border-border bg-background/86 backdrop-blur-xl">
      <div className="scan-grid absolute inset-0 opacity-50" />
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_30px_hsl(var(--color-primary)/0.8)]"
        animate={{ y: ["6%", "94%", "6%"] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <div className="relative flex h-full flex-col justify-between p-6">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-primary">AI Review</span>
            <span className="font-mono text-xs text-text-secondary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {analysisStages.map((stage, index) => {
            const active = index === stageIndex;
            const complete = index < stageIndex;

            return (
              <div
                key={stage}
                className="flex items-center gap-3 rounded-input border border-border/70 bg-surface/64 px-3 py-2"
              >
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    active ? "bg-primary shadow-[0_0_18px_hsl(var(--color-primary)/0.8)]" : "",
                    complete ? "bg-success" : "",
                    !active && !complete ? "bg-muted" : ""
                  ].join(" ")}
                />
                <span className={active ? "text-sm text-text-primary" : "text-sm text-text-secondary"}>
                  {stage}
                </span>
                {active ? <span className="ml-auto h-3 w-28 animate-pulse rounded bg-border/80" /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
