import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030712", // ultra dark slate
        surface: "#0b0f19",
        card: "#111827",
        "card-hover": "#172033",
        muted: "#1f2937",
        code: "#070a12",

        border: {
          subtle: "#1f2937",
          default: "#374151",
          focus: "#3b82f6",
        },

        primary: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
          subtle: "rgba(37, 99, 235, 0.15)",
        },

        status: {
          pass: "#10b981",
          "pass-bg": "rgba(16, 185, 129, 0.15)",
          warn: "#f59e0b",
          "warn-bg": "rgba(245, 158, 11, 0.15)",
          fail: "#ef4444",
          "fail-bg": "rgba(239, 68, 68, 0.15)",
          info: "#3b82f6",
          "info-bg": "rgba(59, 130, 246, 0.15)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
