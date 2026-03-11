/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'outfit-medium': ['Outfit_500Medium', 'sans-serif'],
        'outfit-bold': ['Outfit_700Bold', 'sans-serif'],
        'outfit-black': ['Outfit_900Black', 'sans-serif'],
      },
      colors: {
        brand: {
          main: "var(--color-bg-main)",
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)",
          accent: "var(--color-accent)",
          surface: "var(--color-surface-dark)",
          nav: "var(--color-surface-nav)",
        },
      },
    },
  },
  plugins: [],
};
