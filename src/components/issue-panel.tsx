"use client";

import { Trash2 } from "lucide-react";
import type { UIIssue } from "@/lib/ai/types";
import { severityMeta } from "@/lib/design-system";

interface IssuePanelProps {
  issues: UIIssue[];
  activeIssueId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function IssuePanel({ issues, activeIssueId, onSelect, onDelete }: IssuePanelProps) {
  const severities = ["严重", "中等", "轻微"] as const;

  return (
    <aside className="flex min-h-0 flex-col rounded-panel border border-border bg-surface/78 shadow-surface">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">问题清单</h2>
          <span className="rounded-full border border-border bg-background/70 px-2 py-1 font-mono text-[11px] text-text-secondary">
            {issues.length} issues
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {severities.map((severity) => {
            const count = issues.filter((issue) => issue.severity === severity).length;
            const meta = severityMeta[severity];
            return (
              <div key={severity} className={`rounded-input border px-2 py-2 ${meta.bg} ${meta.border}`}>
                <p className={`text-[11px] font-medium ${meta.tint}`}>{severity}</p>
                <p className="mt-1 font-mono text-lg text-text-primary">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {issues.length === 0 ? (
          <div className="grid h-56 place-items-center text-center">
            <div>
              <p className="text-sm font-medium text-text-primary">暂无标注</p>
              <p className="mt-2 text-xs text-text-secondary">完成走查后会按严重程度聚合问题</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {severities.map((severity) => {
            const groupIssues = issues.filter((issue) => issue.severity === severity);
            if (groupIssues.length === 0) {
              return null;
            }

            return (
              <section key={severity}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${severityMeta[severity].bg}`} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {severity}
                  </p>
                </div>
                <div className="space-y-2">
                  {groupIssues.map((issue) => {
                    const active = issue.id === activeIssueId;
                    return (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => onSelect(issue.id)}
                        className={[
                          "group w-full rounded-card border p-3 text-left transition duration-200 ease-product",
                          active
                            ? "border-danger/55 bg-danger/10 shadow-focus"
                            : "border-border bg-background/54 hover:border-border/80 hover:bg-surface-raised"
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-text-primary">
                              {issue.element}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">
                              {issue.annotation_text}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${severityMeta[issue.severity].bg} ${severityMeta[issue.severity].tint}`}>
                            {issue.type}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-input bg-surface/72 p-2">
                            <p className="text-muted">Design</p>
                            <p className="mt-1 truncate font-mono text-text-primary">{issue.design_value}</p>
                          </div>
                          <div className="rounded-input bg-surface/72 p-2">
                            <p className="text-muted">Build</p>
                            <p className="mt-1 truncate font-mono text-text-primary">
                              {issue.implementation_value}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2">
                          <span className="font-mono text-[11px] text-muted">
                            x{Math.round(issue.bbox.x)} y{Math.round(issue.bbox.y)}
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="删除标注"
                            className="grid h-7 w-7 place-items-center rounded-input text-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(issue.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                onDelete(issue.id);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
