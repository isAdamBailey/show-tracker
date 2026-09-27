import type { Config } from 'tailwindcss'

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        canvas: '#15120f',
        surface: {
          DEFAULT: '#1e1a15',
          hi: '#2a241d'
        },
        line: {
          DEFAULT: '#2c261f',
          strong: '#3b342b'
        },
        skeleton: {
          DEFAULT: '#26211b',
          soft: '#221d18'
        },
        ink: {
          DEFAULT: '#f4efe7',
          2: '#d2c9ba',
          3: '#b8ad9d'
        },
        muted: '#9b907f',
        placeholder: '#8a8072',
        faint: '#6f665a',
        accent: {
          DEFAULT: '#ff7b2e',
          hover: '#ff9150',
          text: '#ff8a4c',
          soft: 'rgba(255, 123, 46, 0.16)',
          'soft-ink': '#ff9a62'
        },
        'on-accent': '#140d07',
        'error-line': '#5a2620',
        warn: {
          bg: '#211a13',
          line: '#3b2c1e',
          ink: '#e8d6c2'
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Barlow Condensed', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      // Handoff type ramp. Body steps 12/14/16 are Tailwind's xs/sm/base.
      fontSize: {
        '13': '13px',
        '15': '15px',
        '20': '20px',
        '22': '22px',
        '24': '24px',
        '30': '30px',
        '34': '34px',
        '40': '40px',
        '52': '52px',
        '64': '64px',
        '72': '72px'
      },
      borderRadius: {
        tag: '4px',
        seg: '6px'
      },
      boxShadow: {
        popover: '0 18px 40px rgba(0, 0, 0, 0.55)'
      }
    }
  }
} satisfies Config
