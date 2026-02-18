import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5A8A5E",
        secondary: "#D4E5D6",
        "background-light": "#F3F4F6",
        "background-dark": "#111827",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1F2937",
        "text-main-light": "#111827",
        "text-main-dark": "#F9FAFB",
        "text-muted-light": "#6B7280",
        "text-muted-dark": "#9CA3AF",
        "border-light": "#E5E7EB",
        "border-dark": "#374151"
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
