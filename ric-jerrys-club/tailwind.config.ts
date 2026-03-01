import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cloud: "var(--cloud)",
        "teal-deep": "var(--teal-deep)",
        "teal-mid": "var(--teal-mid)",
        "teal-light": "var(--teal-light)",
        "teal-glow": "var(--teal-glow)",
        wood: "var(--wood)",
        "wood-light": "var(--wood-light)",
        gold: "var(--gold)",
        ink: "var(--ink)",
        mist: "var(--mist)",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        display: ["var(--font-bebas)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        fadeUp: "fadeUp 1s ease-out forwards",
        fadeIn: "fadeIn 1s ease-out forwards",
        scrollPulse: "scrollPulse 2s ease-in-out infinite",
        livePulse: "livePulse 1.5s ease-in-out infinite",
        ticker: "ticker 20s linear infinite",
        typingBounce: "typingBounce 0.6s ease-in-out infinite",
        waterShimmer: "waterShimmer 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scrollPulse: {
          "0%, 100%": { opacity: "1", transform: "scaleY(1)" },
          "50%": { opacity: "0.4", transform: "scaleY(0.8)" },
        },
        livePulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.3)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        typingBounce: {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-6px)" },
        },
        waterShimmer: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
