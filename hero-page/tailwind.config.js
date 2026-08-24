/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#08090b',
        surface: '#0d0f12',
        elevated: '#12151a',
        subtle: '#181b21',
        brand: {
          blue: '#4f8cff',
          'blue-hover': '#6ea0ff',
          ice: '#6ed6ff',
          muted: 'rgba(79, 140, 255, 0.12)',
        },
        text: {
          primary: '#f5f7fa',
          secondary: '#8e959f',
          tertiary: '#525866',
          muted: '#3b404a',
        },
        sys: {
          green: '#4ade80',
          amber: '#fbbf24',
          red: '#ff5a5f',
        }
      },
      borderColor: {
        hairline: 'rgba(255, 255, 255, 0.07)',
        subtle: 'rgba(255, 255, 255, 0.12)',
        strong: 'rgba(255, 255, 255, 0.20)',
        'brand-accent': 'rgba(79, 140, 255, 0.35)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['Geist', 'Inter', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        'tight-title': '-0.035em',
        'wide-eyebrow': '0.22em',
      },
      boxShadow: {
        'subtle-elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'blue-glow': '0 0 24px -4px rgba(79, 140, 255, 0.25)',
      },
      animation: {
        'pulse-calm': 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
