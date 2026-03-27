/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0D0D0D',
        accent: '#FF5F00',
        silver: '#E0E0E0',
        steel: '#222222',
      },
    },
  },
  plugins: [],
}
