/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'selector', // <--- ESTE ES EL CAMBIO CLAVE (antes era 'class')
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