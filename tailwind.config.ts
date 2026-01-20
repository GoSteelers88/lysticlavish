import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Luxury palette - nude/champagne + espresso/black + gold
        champagne: {
          50: '#FFFDF9',
          100: '#FEF9F0',
          200: '#FCF0DC',
          300: '#F9E4C4',
          400: '#F5D4A4',
          500: '#E8C89A',
          600: '#D4B088',
          700: '#B8946E',
          800: '#9A7856',
          900: '#7C5E42',
        },
        nude: {
          50: '#FDFBF9',
          100: '#F9F5F1',
          200: '#F2EAE3',
          300: '#E8DCD2',
          400: '#D9C9BB',
          500: '#C9B5A4',
          600: '#B49C88',
          700: '#9A816C',
          800: '#7F6854',
          900: '#655140',
        },
        espresso: {
          50: '#F7F5F4',
          100: '#EBE6E3',
          200: '#D4CBC5',
          300: '#B8A99E',
          400: '#998679',
          500: '#7A665A',
          600: '#5C4A40',
          700: '#463831',
          800: '#332924',
          900: '#231C19',
          950: '#150F0D',
        },
        gold: {
          50: '#FFFEF5',
          100: '#FFFCEB',
          200: '#FFF6CC',
          300: '#FFEDA3',
          400: '#FFE070',
          500: '#D4AF37',
          600: '#B8962E',
          700: '#967824',
          800: '#755D1C',
          900: '#5A4715',
        },
        // Semantic colors
        primary: {
          DEFAULT: '#D4AF37',
          light: '#FFE070',
          dark: '#967824',
        },
        secondary: {
          DEFAULT: '#5C4A40',
          light: '#7A665A',
          dark: '#332924',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'display-lg': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.1)',
        'soft-xl': '0 8px 16px -4px rgba(0, 0, 0, 0.08), 0 16px 32px -8px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 24px -4px rgba(212, 175, 55, 0.4)',
        'glow-lg': '0 0 40px -8px rgba(212, 175, 55, 0.5)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-luxury': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
