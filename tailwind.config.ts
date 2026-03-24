import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef1ff',
          100: '#e0e5ff',
          200: '#c7ceff',
          300: '#a5adff',
          400: '#8080ff',
          500: '#6355ff',
          600: '#1428A0',
          700: '#1020840',
          800: '#0e1a6e',
          900: '#0b1557',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
