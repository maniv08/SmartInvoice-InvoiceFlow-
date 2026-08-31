/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Dedicated Invoice & Payment Status Design Tokens
        status: {
          draft: {
            bg: '#f1f5f9',
            text: '#475569',
            border: '#cbd5e1',
            darkBg: 'rgba(51, 65, 85, 0.4)',
            darkText: '#cbd5e1',
          },
          submitted: {
            bg: '#eff6ff',
            text: '#1d4ed8',
            border: '#bfdbfe',
            darkBg: 'rgba(30, 58, 138, 0.3)',
            darkText: '#93c5fd',
          },
          underVerification: {
            bg: '#eff6ff',
            text: '#2563eb',
            border: '#bfdbfe',
            darkBg: 'rgba(37, 99, 235, 0.25)',
            darkText: '#93c5fd',
          },
          pendingApproval: {
            bg: '#fffbeb',
            text: '#b45309',
            border: '#fde68a',
            darkBg: 'rgba(180, 83, 9, 0.3)',
            darkText: '#fcd34d',
          },
          approved: {
            bg: '#ecfdf5',
            text: '#047857',
            border: '#a7f3d0',
            darkBg: 'rgba(4, 120, 87, 0.3)',
            darkText: '#6ee7b7',
          },
          rejected: {
            bg: '#fef2f2',
            text: '#b91c1c',
            border: '#fecaca',
            darkBg: 'rgba(185, 28, 28, 0.3)',
            darkText: '#fca5a5',
          },
          paymentProcessing: {
            bg: '#f5f3ff',
            text: '#6d28d9',
            border: '#ddd6fe',
            darkBg: 'rgba(109, 40, 217, 0.3)',
            darkText: '#c4b5fd',
          },
          paid: {
            bg: '#f0fdf4',
            text: '#15803d',
            border: '#bbf7d0',
            darkBg: 'rgba(21, 128, 61, 0.3)',
            darkText: '#86efac',
          },
          overdue: {
            bg: '#fff1f2',
            text: '#be123c',
            border: '#fecdd3',
            darkBg: 'rgba(190, 18, 60, 0.3)',
            darkText: '#fda4af',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
