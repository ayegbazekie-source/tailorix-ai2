/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        tx: {
          bg: '#101112',
          surface: '#161719',
          elevated: '#1C1D1F',
          secondary: '#222426',
          tertiary: '#292B2E',
          border: '#2A2B2E',
          'border-subtle': '#202123',
          'border-hover': '#383A3E',
          text: '#F5F5F7',
          'text-secondary': '#9E9EA7',
          'text-muted': '#686973',
          gold: {
            DEFAULT: '#C5A059',
            hover: '#D4AF37',
            light: '#E2BF72',
            dim: 'rgba(197, 160, 89, 0.12)',
            glow: 'rgba(197, 160, 89, 0.22)',
            border: 'rgba(197, 160, 89, 0.32)',
            text: '#E5C07B',
          },
          canvas: {
            bed: '#F3F3F0',
            stroke: '#1A1B1D',
            grid: '#E4E4DE',
            gridMajor: '#D4D4CD',
            seam: '#787980',
            grain: '#997832',
          }
        },
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'floating': '0 12px 32px -4px rgba(0, 0, 0, 0.55)',
        'gold-glow': '0 0 16px -2px rgba(197, 160, 89, 0.35)',
        'gold-sm': '0 0 8px rgba(197, 160, 89, 0.25)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
