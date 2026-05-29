import type { Config } from "tailwindcss";

/**
 * ChartMark design system. Token color semantics, staleness palette, and the
 * three typefaces from the design doc are exposed as Tailwind theme tokens so
 * components and the editor stylesheet share a single source of truth.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"DM Mono"', "ui-monospace", "monospace"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
      colors: {
        // Per-token-type semantic colors (foreground / background).
        token: {
          med: { fg: "#1A5C9E", bg: "#EBF2FB" },
          "lab-normal": { fg: "#1A7A4A", bg: "#EAF5EF" },
          "lab-high": { fg: "#9E1A1A", bg: "#FBEBEB" },
          "lab-low": { fg: "#1A5C9E", bg: "#EBF2FB" },
          vital: { fg: "#6B35A8", bg: "#F3EDF9" },
          problem: { fg: "#9E5C1A", bg: "#FBF2EB" },
          allergy: { fg: "#9E1A1A", bg: "#FBEBEB" },
          consult: { fg: "#2D5A8A", bg: "#EBF0F7" },
          date: { fg: "#5A5550", bg: "#F0EFED" },
          stale: { fg: "#A09C94", bg: "#F2F0EB" },
        },
      },
      keyframes: {
        "token-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.82" },
        },
        "token-flash": {
          "0%": { backgroundColor: "#FEF3C7", boxShadow: "0 0 0 2px #FCD34D" },
          "100%": { backgroundColor: "transparent", boxShadow: "0 0 0 0 transparent" },
        },
      },
      animation: {
        "token-pulse": "token-pulse 2.4s ease-in-out infinite",
        "token-flash": "token-flash 1.1s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
