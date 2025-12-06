/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./aureon-os/index.html",
    "./aureon-os/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aureon: { 
          black: '#030305', 
          dark: '#0A0A0C', 
          gold: '#D4AF37', 
          green: '#4ade80', 
          red: '#f87171', 
          blue: '#60a5fa', 
          purple: '#c084fc' 
        }
      },
      fontFamily: { 
        serif: ['Cinzel', 'serif'], 
        sans: ['Outfit', 'sans-serif'] 
      }
    },
  },
  plugins: [],
}