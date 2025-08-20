/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        pulse: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 2s infinite",
      },
      screens: {
        xs: "475px",
      },
      colors: {
        primary: "#0385FF",
        secondary: "#7181e3",
        slate: {
          850: "#1a202c",
        },
      },
    },
  },
  plugins: [],
};
