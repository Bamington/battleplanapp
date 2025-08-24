/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'title': 'var(--color-title)',
        'text': 'var(--color-text)',
        'secondary-text': 'var(--color-secondary-text)',
        'brand': 'var(--color-brand)',
        'button-red': 'var(--color-button-red)',
        'input-label': 'var(--color-input-label)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-card': 'var(--color-bg-card)',
        'bg-card-secondary':  'var(--color-bg-card-secondary)',
        'border-custom': 'var(--color-border)',
        'modal-bg': 'var(--color-modal-bg)',
      },
      fontFamily: {
        'overpass': ['Overpass', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
