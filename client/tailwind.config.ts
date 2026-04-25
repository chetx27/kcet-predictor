import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A0F',
          surface: '#12121A',
          elevated: '#1A1A24',
          border: '#222233',
        },
        brand: {
          indigo: '#6366F1',
          violet: '#7C3AED',
          soft: '#818CF8',
        },
        status: {
          safe: '#34D399',
          moderate: '#FBBF24',
          reach: '#F87171',
          info: '#60A5FA',
        },
        text: {
          primary: '#E8EAF0',
          secondary: '#8B8FA3',
          muted: '#4A4D5E',
        },
      },
      fontFamily: {
        heading: ['"Cabinet Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
