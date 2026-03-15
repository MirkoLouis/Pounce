/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'alab-orange': '#FF8C00', // MSUIIT Alab themed orange
        'alab-dark': '#1a1a1a',
      }
    },
  },
  plugins: [],
}
