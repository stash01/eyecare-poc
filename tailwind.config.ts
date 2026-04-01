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
        primary: {
          50:  "#eef7f9",
          100: "#d0eaef",
          200: "#a1d5e0",
          300: "#60b9cc",
          400: "#2898b2",
          500: "#107b98",
          600: "#0b617d",
          700: "#094e66",
          800: "#073c51",
          900: "#042a3a",
        },
        accent: {
          50:  "#fff8ed",
          100: "#fdefd5",
          200: "#fad8a5",
          300: "#f7bb6a",
          400: "#f49733",
          500: "#f17b15",
          600: "#df600d",
          700: "#b94b0e",
          800: "#943c13",
          900: "#783313",
        },
        stone: {
          50:  "#faf9f7",
          100: "#f3f0eb",
          200: "#e5e0d8",
          300: "#d0c9be",
          400: "#b5ab9d",
          500: "#9a8f80",
          600: "#7e7368",
          700: "#655c53",
          800: "#534b44",
          900: "#433d38",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-dm-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        "card":    "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 4px 16px -2px rgb(0 0 0 / 0.08)",
        "card-lg": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 12px 32px -4px rgb(0 0 0 / 0.12)",
        "glow":    "0 0 40px -8px rgb(11 97 125 / 0.35)",
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
export default config;
