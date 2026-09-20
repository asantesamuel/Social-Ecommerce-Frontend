import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        minimal: {
          red: "#ef4444",
          redDark: "#dc2626",
          white: "#ffffff",
          offWhite: "#f8fafc",
          gray: "#94a3b8",
          dark: "#0f172a",
        },
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
      },
      backdropBlur: {
        glass: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
