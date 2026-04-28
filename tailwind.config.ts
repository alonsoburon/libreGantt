import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1116",
          soft: "#2A2F3A",
          muted: "#5B6270",
        },
        paper: {
          DEFAULT: "#FAFAF7",
          warm: "#F2EFE7",
          line: "#E5E2D9",
        },
        accent: {
          DEFAULT: "#C2410C",
          soft: "#FED7AA",
        },
        marine: {
          DEFAULT: "#1E3A5F",
          soft: "#BFD4E8",
        },
        moss: {
          DEFAULT: "#4F6F52",
          soft: "#D5E0CD",
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        paper: "0 1px 0 rgba(14,17,22,0.04), 0 8px 24px -12px rgba(14,17,22,0.12)",
        bar: "0 1px 0 rgba(14,17,22,0.08), 0 2px 6px -2px rgba(14,17,22,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
