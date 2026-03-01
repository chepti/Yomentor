/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        'icon-primary': 'var(--icon-primary)',
        'icon-secondary': 'var(--icon-secondary)',
        'icon-accent': 'var(--icon-accent)',
        'icon-danger': 'var(--icon-danger)',
        'icon-warning': 'var(--icon-warning)',
      },
      fontFamily: {
        sans: ['Varela Round', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        pill: '50px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
}
