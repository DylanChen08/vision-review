import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--color-primary) / <alpha-value>)",
        secondary: "hsl(var(--color-secondary) / <alpha-value>)",
        accent: "hsl(var(--color-accent) / <alpha-value>)",
        danger: "hsl(var(--color-danger) / <alpha-value>)",
        warning: "hsl(var(--color-warning) / <alpha-value>)",
        success: "hsl(var(--color-success) / <alpha-value>)",
        background: "hsl(var(--color-background) / <alpha-value>)",
        surface: "hsl(var(--color-surface) / <alpha-value>)",
        "surface-raised": "hsl(var(--color-surface-raised) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)",
        "text-primary": "hsl(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "hsl(var(--color-text-secondary) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)"
      },
      borderRadius: {
        card: "var(--radius-card)",
        input: "var(--radius-input)",
        tooltip: "var(--radius-tooltip)",
        modal: "var(--radius-modal)",
        panel: "var(--radius-panel)"
      },
      boxShadow: {
        surface: "var(--shadow-surface)",
        floating: "var(--shadow-floating)",
        overlay: "var(--shadow-overlay)",
        focus: "var(--shadow-focus)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      },
      transitionTimingFunction: {
        product: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        precision: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: []
};

export default config;
