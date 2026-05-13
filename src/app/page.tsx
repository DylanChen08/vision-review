"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Play, Settings2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { AnalysisLoader } from "@/components/analysis-loader";
import { IssuePanel } from "@/components/issue-panel";
import { ReviewCanvas } from "@/components/review-canvas";
import { ThemeToggle } from "@/components/theme-toggle";
import { UploadSlot } from "@/components/upload-slot";
import type { UIIssue } from "@/lib/ai/types";
import { analysisStages } from "@/lib/design-system";
import { exportAnnotatedPng, exportMarkdown } from "@/lib/export";
import type { ImageAsset } from "@/lib/image";

type AnalysisState = "idle" | "analyzing" | "done" | "error";

export default function Home() {
  const [designAsset, setDesignAsset] = useState<ImageAsset | null>(null);
  const [implementationAsset, setImplementationAsset] = useState<ImageAsset | null>(null);
  const [issues, setIssues] = useState<UIIssue[]>([]);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = Boolean(designAsset && implementationAsset && analysisState !== "analyzing");
  const dimensionState = useMemo(() => {
    if (!designAsset || !implementationAsset) {
      return "等待图片";
    }

    return designAsset.width === implementationAsset.width && designAsset.height === implementationAsset.height
      ? "尺寸一致"
      : `尺寸不一致 · ${designAsset.width}×${designAsset.height} / ${implementationAsset.width}×${implementationAsset.height}`;
  }, [designAsset, implementationAsset]);

  useEffect(() => {
    if (analysisState !== "analyzing") {
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((value) => Math.min(92, value + Math.random() * 8 + 3));
    }, 520);

    return () => window.clearInterval(interval);
  }, [analysisState]);

  useEffect(() => {
    setStageIndex(Math.min(analysisStages.length - 1, Math.floor((progress / 100) * analysisStages.length)));
  }, [progress]);

  async function runAnalysis() {
    if (!designAsset || !implementationAsset) {
      return;
    }

    setAnalysisState("analyzing");
    setProgress(8);
    setStageIndex(0);
    setError(null);
    setActiveIssueId(null);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          designImage: designAsset.src,
          implementationImage: implementationAsset.src
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "分析失败");
      }

      setProgress(100);
      setIssues(payload.issues);
      setAnalysisState("done");
      setActiveIssueId(payload.issues[0]?.id ?? null);
    } catch (caught) {
      setAnalysisState("error");
      setError(caught instanceof Error ? caught.message : "分析失败");
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-4 text-text-primary xl:h-screen xl:overflow-hidden sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-[1800px] flex-col gap-4">
        <header className="shrink-0 rounded-panel border border-border bg-surface/76 p-4 shadow-surface backdrop-blur-xl">
          <div className="grid gap-4 xl:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] xl:items-center">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-input border border-primary/30 bg-primary/10 text-primary">
                  <Sparkles size={18} />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-0 text-text-primary">Vision Review</h1>
                  <p className="mt-1 truncate text-xs text-text-secondary">
                    面向设计师的 UI 还原度一键走查工具
                  </p>
                </div>
              </div>
              <div className="xl:hidden">
                <ThemeToggle />
              </div>
            </div>

            <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_144px_auto]">
              <UploadSlot
                label="上传设计稿"
                description="PNG / JPG / WebP，建议与实现图同尺寸"
                asset={designAsset}
                onChange={(asset) => {
                  setDesignAsset(asset);
                  setIssues([]);
                  setAnalysisState("idle");
                }}
              />
              <UploadSlot
                label="上传实现图"
                description="AI 标注会绘制在这张图上"
                asset={implementationAsset}
                onChange={(asset) => {
                  setImplementationAsset(asset);
                  setIssues([]);
                  setAnalysisState("idle");
                }}
              />
              <motion.button
                type="button"
                whileTap={{ scale: canAnalyze ? 0.98 : 1 }}
                disabled={!canAnalyze}
                onClick={runAnalysis}
                className="flex min-h-[76px] items-center justify-center gap-2 rounded-panel border border-primary/35 bg-primary px-5 text-sm font-semibold text-background shadow-[0_0_36px_hsl(var(--color-primary)/0.18)] transition duration-200 ease-product hover:bg-primary/92 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted/20 disabled:text-muted"
              >
                <Play size={16} />
                一键走查
              </motion.button>
              <div className="hidden min-h-[76px] items-center justify-center xl:flex">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          <aside className="grid min-w-0 content-start gap-4 overflow-hidden xl:min-h-0 xl:overflow-auto">
            <div className="min-w-0 rounded-panel border border-border bg-surface/76 p-4 shadow-surface">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">输入校验</h2>
                <Settings2 size={15} className="text-muted" />
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <MetaRow label="尺寸状态" value={dimensionState} />
                <MetaRow label="Provider" value="ai.config.ts" />
                <MetaRow label="标注层" value="Canvas" />
                <MetaRow label="导出格式" value="PNG / Markdown" />
              </div>
              {error ? (
                <div className="mt-4 break-words rounded-input border border-danger/28 bg-danger/10 p-3 text-xs leading-5 text-danger">
                  {error}
                </div>
              ) : null}
            </div>

            <PreviewPanel title="设计稿" asset={designAsset} />
          </aside>

          <section className="relative flex min-h-[520px] min-w-0 flex-col xl:min-h-0">
            <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Review Canvas</p>
                <h2 className="mt-1 text-xl font-semibold text-text-primary">实现图标注画布</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!implementationAsset || issues.length === 0}
                  onClick={() => {
                    if (implementationAsset) {
                      void exportAnnotatedPng(implementationAsset.src, issues, "vision-review-annotated.png");
                    }
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-input border border-border bg-surface px-3 text-xs font-medium text-text-secondary transition hover:border-primary/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Download size={14} />
                  导出 PNG
                </button>
                <button
                  type="button"
                  disabled={issues.length === 0}
                  onClick={() => exportMarkdown(issues, "vision-review-fix-list.md")}
                  className="inline-flex h-9 items-center gap-2 rounded-input border border-border bg-surface px-3 text-xs font-medium text-text-secondary transition hover:border-primary/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <FileText size={14} />
                  导出 Markdown
                </button>
              </div>
            </div>
            <div className="relative min-h-0 flex-1">
              <ReviewCanvas
                implementation={implementationAsset}
                issues={issues}
                activeIssueId={activeIssueId}
                onActiveIssueChange={setActiveIssueId}
              />
              {analysisState === "analyzing" ? <AnalysisLoader progress={progress} stageIndex={stageIndex} /> : null}
            </div>
          </section>

          <IssuePanel
            issues={issues}
            activeIssueId={activeIssueId}
            onSelect={setActiveIssueId}
            onDelete={(id) => {
              setIssues((current) => current.filter((issue) => issue.id !== id));
              setActiveIssueId((current) => (current === id ? null : current));
            }}
          />
        </section>
      </div>
    </main>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/70 pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-text-secondary">{label}</span>
      <span className="min-w-0 truncate text-right font-mono text-text-primary">{value}</span>
    </div>
  );
}

function PreviewPanel({ title, asset }: { title: string; asset: ImageAsset | null }) {
  return (
    <div className="rounded-panel border border-border bg-surface/76 p-4 shadow-surface">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-input border border-border bg-background/74">
        {asset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.src} alt={title} className="max-h-[260px] w-full object-contain" />
        ) : (
          <div className="grid h-44 place-items-center text-xs text-text-secondary">未上传</div>
        )}
      </div>
    </div>
  );
}
