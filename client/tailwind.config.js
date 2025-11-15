import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        // Red and Black Theme
        primary: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6b6b',
          500: '#ff3333',
          600: '#e60000',
          700: '#cc0000',
          800: '#990000',
          900: '#660000',
          950: '#330000',
        },
        dark: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#c2c2c2',
          300: '#a3a3a3',
          400: '#6b6b6b',
          500: '#4a4a4a',
          600: '#2e2e2e',
          700: '#1f1f1f',
          800: '#141414',
          900: '#0a0a0a',
          950: '#000000',
        },
        accent: {
          red: '#e60000',
          'red-light': '#ff3333',
          'red-dark': '#990000',
          black: '#0a0a0a',
          'gray-dark': '#1f1f1f',
          'gray-medium': '#2e2e2e',
        }
      },
      backgroundImage: {
        'gradient-red-black': 'linear-gradient(135deg, #e60000 0%, #0a0a0a 100%)',
        'gradient-black-red': 'linear-gradient(135deg, #0a0a0a 0%, #e60000 100%)',
        'gradient-red-dark': 'linear-gradient(135deg, #ff3333 0%, #990000 100%)',
        'radial-red': 'radial-gradient(circle at center, #e60000 0%, #0a0a0a 100%)',
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(230, 0, 0, 0.5)',
        'red-glow-lg': '0 0 40px rgba(230, 0, 0, 0.6)',
        'dark-lg': '0 10px 50px rgba(0, 0, 0, 0.8)',
      }
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: '#e60000',
              foreground: '#ffffff',
            },
            focus: '#e60000',
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: '#ff3333',
              foreground: '#ffffff',
            },
            background: '#0a0a0a',
            foreground: '#ffffff',
            focus: '#ff3333',
          },
        },
      },
    }),
  ],
}

module.exports = config;
