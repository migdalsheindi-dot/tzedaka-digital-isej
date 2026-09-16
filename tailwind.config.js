/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts}"],
  theme: {
    extend: {
      colors: {
        isej: {
          navy: "#0B2647",
          blue: "#1B3A6B",
          sky: "#5DADE2",
          skydark: "#2E86AB",
          white: "#F5FAFF",
          red: "#E31E25",
          reddark: "#A6151A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "box-wobble": {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(-1.5deg) scale(1.015)" },
          "60%": { transform: "rotate(1.5deg) scale(1.02)" },
          "100%": { transform: "rotate(0deg) scale(1)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "box-wobble": "box-wobble 0.5s ease-in-out",
        "pop-in": "pop-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
