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
        background: "#071017", // Primary deep SOC background
        surface: "#0B141D",    // Secondary background surface
        tertiary: "#0E1923",   // Tertiary dark layer
        elevated: "#111E29",   // Elevated modals & popovers
        panel: "#0C161F",      // SOC Card & Panel background
        "panel-hover": "#111F2A",
        card: "#0C161F",
        "card-hover": "#111F2A",

        border: {
          subtle: "#1A2A36",
          default: "#223442",
          active: "#2D4657",
          focus: "#2ED477",
        },

        text: {
          primary: "#E6EDF3",
          secondary: "#9AAAB5",
          muted: "#657582",
        },

        primary: {
          DEFAULT: "#2ED477", // Restrained SOC green accent
          hover: "#26ba67",
          dim: "#173F2B",
          subtle: "rgba(46, 212, 119, 0.12)",
        },

        accent: {
          green: "#2ED477",
          "green-dim": "#173F2B",
          blue: "#4C8DFF",
          yellow: "#D8B84C",
          orange: "#E8893C",
          red: "#E45454",
        },

        status: {
          pass: "#2ED477",
          "pass-bg": "rgba(46, 212, 119, 0.12)",
          warn: "#D8B84C",
          "warn-bg": "rgba(216, 184, 76, 0.12)",
          fail: "#E45454",
          "fail-bg": "rgba(228, 84, 84, 0.12)",
          info: "#4C8DFF",
          "info-bg": "rgba(76, 141, 255, 0.12)",
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
