export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Manrope",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
    },
    colors: {
      primary: {
        300: "#f2f693",
        400: "#f0f47e",
        500: "#ecf15e",
        DEFAULT: "#ecf15e",
      },
      secondary: {
        300: "#dddddd",
        400: "#d6d6d6",
        500: "#cccccc",
        DEFAULT: "#cccccc",
      },
      "black-1": "#0e0f11",
      "black-2": "#222222",
    },
  },
};
