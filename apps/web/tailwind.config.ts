import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: "#E8650A",
        gold: "#D4A017",
        marigold: "#F5A623",
        cream: {
          DEFAULT: "#FFF8EE",
          dark: "#F5EDD8",
        },
        "deep-brown": "#1C0A00",
        "sacred-red": "#8B1A1A",
        "night-blue": "#0D1B2A",

        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
      },
      fontFamily: {
        heading: ["var(--font-tiro)", "Georgia", "serif"],
        body: ["var(--font-inter)", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        sacred: "16px",
        "sacred-sm": "10px",
        "sacred-lg": "24px",
      },
      boxShadow: {
        sacred: "0 4px 24px rgba(232, 101, 10, 0.08)",
        "sacred-hover": "0 8px 40px rgba(232, 101, 10, 0.14)",
        "sacred-glow": "inset 0 0 0 1px rgba(232, 101, 10, 0.1)",
      },
      animation: {
        "sacred-pulse": "sacred-pulse 2s ease-in-out infinite",
        "gentle-float": "gentle-float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
