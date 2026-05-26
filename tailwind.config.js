/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#598dff",
          500: "#3366ff",
          600: "#1f47e6",
          700: "#1736b8",
          800: "#172f8f",
          900: "#162b73",
          950: "#0f1c4d",
        },
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#dde1e9",
          300: "#bfc6d3",
          400: "#8d96a7",
          500: "#5d6678",
          600: "#3f4759",
          700: "#2c3344",
          800: "#1c2231",
          900: "#11151f",
          950: "#080b13",
        },
        success: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          500: "#10b981",
          600: "#059669",
        },
        warning: {
          DEFAULT: "#f59e0b",
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        },
        danger: {
          DEFAULT: "#ef4444",
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(17, 21, 31, 0.04), 0 1px 3px 0 rgba(17, 21, 31, 0.06)",
        elevated:
          "0 4px 8px -2px rgba(17, 21, 31, 0.06), 0 10px 30px -8px rgba(17, 21, 31, 0.10)",
        glow: "0 0 0 4px rgba(51, 102, 255, 0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
