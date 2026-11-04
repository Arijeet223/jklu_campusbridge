import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF8F6',
        surface: '#FFFFFF',
        subtle: '#F1EFEA',
        shell: '#F1EFEA',
        blossom: '#F0B6D5',
        sky: '#B6D9EC',
        mint: '#B6DEC9',
        plum: {
          DEFAULT: '#6D3B56',
          dark: '#552940',
        },
        'ai-ghost': '#F5F3FF',
        'border-hairline': '#E6E3DC',
        'border-ai-dashed': '#C4B5FD',
        ink: {
          primary: '#111827',
          secondary: '#4B5563',
          muted: '#6B7280',
        },
        oxford: {
          DEFAULT: '#1E3A8A',
          surface: '#EFF6FF',
          border: '#BFDBFE',
        },
        emerald: {
          DEFAULT: '#0F766E',
          surface: '#F0FDFA',
          border: '#99F6E4',
        },
        amber: {
          DEFAULT: '#B45309',
          surface: '#FFFBEB',
          border: '#FDE68A',
        },
        crimson: {
          DEFAULT: '#BE123C',
          surface: '#FFF1F2',
          border: '#FECDD3',
        },
        iris: {
          DEFAULT: '#6D28D9',
          surface: '#F5F3FF',
          border: '#DDD6FE',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-h1': ['1.625rem', { lineHeight: '1.25', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-h2': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'dense': ['0.84375rem', { lineHeight: '1.5', fontWeight: '500' }],
        'provenance': ['0.75rem', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '500' }],
      },
      maxWidth: {
        prose: '68ch',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
      },
    },
  },
  plugins: [],
}
export default config
