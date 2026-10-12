/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        climate: {
          primary: '#059669', // Emerald 600
          primaryDark: '#047857', // Emerald 700
          lightBg: '#f0fdf4', // Emerald 50
          cardBg: '#ffffff',
          accent: '#10b981', // Emerald 500
          border: '#d1fae5', // Emerald 100
        }
      }
    },
  },
  plugins: [],
}
