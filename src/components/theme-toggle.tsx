"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "vision-review-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferredTheme =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    applyTheme(preferredTheme);
    setTheme(preferredTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "切换到白天模式" : "切换到黑夜模式"}
      onClick={toggleTheme}
      className="group inline-flex h-10 items-center gap-2 rounded-input border border-border bg-surface px-3 text-xs font-medium text-text-secondary shadow-surface transition duration-200 ease-product hover:border-primary/40 hover:text-text-primary"
    >
      <span className="relative grid h-5 w-9 place-items-center rounded-full border border-border bg-background/75">
        <span
          className={[
            "absolute h-4 w-4 rounded-full bg-primary transition-transform duration-300 ease-precision",
            isDark ? "translate-x-2" : "-translate-x-2"
          ].join(" ")}
        />
        <Sun
          size={11}
          className={[
            "absolute left-1 transition",
            isDark ? "text-muted opacity-40" : "text-background opacity-100"
          ].join(" ")}
        />
        <Moon
          size={11}
          className={[
            "absolute right-1 transition",
            isDark ? "text-background opacity-100" : "text-muted opacity-40"
          ].join(" ")}
        />
      </span>
      <span>{mounted && isDark ? "黑夜模式" : "白天模式"}</span>
    </button>
  );
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}
