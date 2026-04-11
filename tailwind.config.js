/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontSize: {
        'elder-sm': ['1.125rem', '1.75rem'],
        'elder-base': ['1.375rem', '2rem'],
        'elder-lg': ['1.75rem', '2.5rem'],
        'elder-xl': ['2.25rem', '3rem'],
        'elder-2xl': ['3rem', '3.75rem'],
      },
      colors: {
        helper: {
          navy: '#1B2A4A',
          blue: '#3B82F6',
          'blue-dark': '#1D4ED8',
          teal: '#0891B2',
          green: '#16A34A',
          red: '#DC2626',
          amber: '#D97706',
          'gray-light': '#F8FAFC',
          'gray-mid': '#E2E8F0',
          'gray-text': '#475569',
        }
      },
      minHeight: {
        'touch': '72px',
      },
      minWidth: {
        'touch': '72px',
      }
    },
  },
  plugins: [],
}
