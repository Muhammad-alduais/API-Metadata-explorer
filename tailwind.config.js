/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'body': ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        'mono': ['"Fira Mono"', 'monospace'],
      },
      colors: {
        blue: {
          50: '#e7f1ff',
          100: '#d0e3ff',
          200: '#a0c7fe',
          300: '#71abfd',
          400: '#418ffc',
          500: '#1273fb',
          600: '#0d6efd',
          700: '#0b5ed7',
          800: '#084298',
          900: '#052c65',
        },
        cyan: {
          50: '#e5feff',
          100: '#cefdff',
          200: '#9efaff',
          300: '#6ef7ff',
          400: '#3ef4ff',
          500: '#0ef1ff',
          600: '#0dcaf0',
          700: '#0ba6c9',
          800: '#0885a1',
          900: '#056679',
        },
      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};