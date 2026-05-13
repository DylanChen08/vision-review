"use client";

import { Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import type { ImageAsset } from "@/lib/image";
import { formatFileSize, readImageAsset } from "@/lib/image";

interface UploadSlotProps {
  label: string;
  description: string;
  asset: ImageAsset | null;
  onChange: (asset: ImageAsset | null) => void;
}

export function UploadSlot({ label, description, asset, onChange }: UploadSlotProps) {
  return (
    <label className="group relative flex min-h-[76px] min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-panel border border-border bg-surface/72 p-3 shadow-surface transition duration-300 ease-product hover:border-primary/38 hover:bg-surface-raised/78">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            onChange(await readImageAsset(file));
          }
          event.currentTarget.value = "";
        }}
      />
      <motion.div
        whileHover={{ scale: 1.04 }}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-input border border-border bg-background/76 text-text-secondary transition group-hover:text-primary"
      >
        <Upload size={18} />
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{label}</p>
          {asset ? (
            <span className="rounded-full border border-success/26 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              已载入
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-text-secondary">
          {asset
            ? `${asset.name} · ${asset.width}×${asset.height} · ${formatFileSize(asset.size)}`
            : description}
        </p>
      </div>
      {asset ? (
        <button
          type="button"
          aria-label="移除图片"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-input text-muted transition hover:bg-danger/10 hover:text-danger"
          onClick={(event) => {
            event.preventDefault();
            onChange(null);
          }}
        >
          <X size={15} />
        </button>
      ) : null}
    </label>
  );
}
