/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        healix: {
          navy: '#0B1628',
          teal: '#00C9B1',
          surface: '#F7F8FA',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(11, 22, 40, 0.08)',
      },
    },
  },
  plugins: [],
}

