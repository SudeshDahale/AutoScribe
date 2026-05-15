/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#aa3bff",
          light: "rgba(170,59,255,0.12)",
          border: "rgba(170,59,255,0.45)",
        },
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "Consolas", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};