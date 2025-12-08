/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens CSS AUREON - Adaptáveis ao tema (light/dark)
        aureon: { 
          bg: 'var(--aureon-bg)',
          surface: 'var(--aureon-surface)',
          'muted-surface': 'var(--aureon-muted-surface)',
          sidebar: 'var(--aureon-sidebar)',
          header: 'var(--aureon-header)',
          footer: 'var(--aureon-footer)',
          border: 'var(--aureon-border)',
          text: 'var(--aureon-text)',
          subtext: 'var(--aureon-subtext)',
          muted: 'var(--aureon-muted)',
          gold: 'var(--aureon-gold)',
          'gold-strong': 'var(--aureon-gold-strong)',
          'gold-contrast': 'var(--aureon-gold-contrast)',
          blue: 'var(--aureon-blue)',
          green: 'var(--aureon-green)',
          purple: 'var(--aureon-purple)',
          yellow: 'var(--aureon-yellow)',
          red: 'var(--aureon-red)',
          teal: 'var(--aureon-teal)',
        }
      },
      fontFamily: { 
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cinzel', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif']
      },
      boxShadow: {
        'aureon': 'var(--aureon-shadow)',
      }
    },
  },
  plugins: [],
}
