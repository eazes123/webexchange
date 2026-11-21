import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ex-bg":     "#070707",
        "ex-card":   "#0d0d0d",
        "ex-card2":  "#131313",
        "ex-border": "#1e1e1e",
        "ex-yellow": "#f0b90b",
        "ex-green":  "#0ecb81",
        "ex-red":    "#f6465d",
        "ex-blue":   "#1890ff",
      },
      animation: {
        "ticker-scroll": "tickerScroll 35s linear infinite",
      },
      keyframes: {
        tickerScroll: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
