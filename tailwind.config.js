/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'selector', // <--- IMPORTANTE: 'selector' es la clave en v4
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}