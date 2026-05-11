/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Inner Cirql brand bible. HSL only, no rounded corners anywhere.
        ink: "hsl(0 0% 10%)",
        "ink-08": "hsl(0 0% 10% / 0.08)",
        "ink-60": "hsl(0 0% 10% / 0.60)",
        canvas: "hsl(0 0% 100%)",
        offwhite: "hsl(40 33% 97%)",
        gold: "hsl(36 38% 60%)",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        full: "0",
      },
    },
  },
  plugins: [],
};
