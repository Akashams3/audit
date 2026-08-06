/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fcf3f3',
          100: '#fae4e4',
          200: '#f5cdcd',
          300: '#eca9a9',
          400: '#de7a7a',
          500: '#a32a2a', // Primary Dark Crimson
          600: '#8c2020',
          700: '#751a1a',
          800: '#5e1515',
          900: '#471010',
          950: '#2b0707',
        }
      }
    },
  },
  plugins: [],
}
