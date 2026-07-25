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
        // Single source of truth is app/globals.css :root — these
        // reference the same CSS custom properties rather than
        // duplicating hex values, so the palette can't drift out of
        // sync between Tailwind utilities and inline `var(--x)` usage.
        saffron: "var(--saffron)",
        gold: "var(--gold)",
        marigold: "var(--marigold)",
        cream: {
          DEFAULT: "var(--cream)",
          dark: "var(--cream-dark)",
        },
        "deep-brown": "var(--deep-brown)",
        "sacred-red": "var(--sacred-red)",
        "night-blue": "var(--night-blue)",
        status: {
          green: "var(--status-green)",
          amber: "var(--status-amber)",
          red: "var(--status-red)",
        },

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
