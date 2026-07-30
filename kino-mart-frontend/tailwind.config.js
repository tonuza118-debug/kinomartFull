import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0B0B0B',
          soft: '#141414',
          raised: '#1B1B1B',
        },
        neon: {
          DEFAULT: '#E9FF00',
          dim: '#C7DB00',
          glow: 'rgba(233, 255, 0, 0.35)',
        },
        ink: {
          DEFAULT: '#FFFFFF',
          muted: '#A6A6A6',
          faint: '#6E6E6E',
        },
        line: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        heading: ['"Poppins"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.45)',
        neon: '0 0 24px rgba(233,255,0,0.25)',
        'neon-lg': '0 0 60px rgba(233,255,0,0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [typography],
}
