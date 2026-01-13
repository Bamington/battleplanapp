/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './src/ui/**/*.{tsx,ts,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'title': 'var(--color-title)',
        'text': 'var(--color-text)',
        'text-hover': 'var(--color-text-hover)',
        'secondary-text': 'var(--color-secondary-text)',
        'brand': 'var(--color-brand)',
        'brand-hover': 'var(--color-brand-hover)',
        'button-red': 'var(--color-button-red)',
        'button-red-hover': 'var(--color-button-red-hover)',
        'input-label': 'var(--color-input-label)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-card': 'var(--color-bg-card)',
        'bg-card-secondary': 'var(--color-bg-card-secondary)',
        'border-custom': 'var(--color-border)',
        'modal-bg': 'var(--color-modal-bg)',
        'white': 'var(--color-white)',
        'icon': 'var(--color-icon)',
        'icon-hover': 'var(--color-icon-hover)',
        'icon-active': 'var(--color-icon-active)',
        'icon-disabled': 'var(--color-icon-disabled)',
      },
      fontFamily: {
        'overpass': ['Overpass', 'sans-serif'],
      },
    },
  },
  plugins: [],
  presets: [require("./src/ui/tailwind.config.js")]
};
