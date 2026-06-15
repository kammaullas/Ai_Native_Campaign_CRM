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
          dark: '#0F172A',
          slate: '#1E293B',
          accent: '#6366F1'
        }
      }
    },
  },
  plugins: [],
}
