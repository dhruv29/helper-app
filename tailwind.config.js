/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        lora: ['Lora', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        'elder-sm':   ['1.125rem', '1.75rem'],
        'elder-base': ['1.375rem', '2rem'],
        'elder-lg':   ['1.75rem',  '2.5rem'],
        'elder-xl':   ['2.25rem',  '3rem'],
        'elder-2xl':  ['3rem',     '3.75rem'],
      },
      colors: {
        helper: {
          // Design system — warm ink + cream
          ink:         '#1C1917',
          'ink-mid':   '#2D2A27',
          'ink-light': '#6B6560',
          'ink-muted': '#A09890',
          cream:       '#EDE8DF',
          'cream-mid': '#F7F4EF',
          'cream-input':'#F0EBE2',
          border:      '#C8C0B4',
          // Accent
          peach:       '#E8A890',
          'peach-deep':'#C88C70',
          sage:        '#8FAF9F',
          gold:        '#E8C890',
          danger:      '#C0392B',
          // Legacy (kept for VoiceConnect states)
          navy:        '#1B2A4A',
          blue:        '#3B82F6',
          'blue-dark': '#1D4ED8',
          green:       '#16A34A',
          red:         '#DC2626',
          amber:       '#D97706',
          'gray-light':'#F8FAFC',
          'gray-mid':  '#E2E8F0',
          'gray-text': '#475569',
        }
      },
      minHeight: { touch: '72px' },
      minWidth:  { touch: '72px' },
    },
  },
  plugins: [],
}
