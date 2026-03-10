/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // deep indigo
          light: '#6366F1',
          dark: '#4338CA',
        },
        accent: {
          DEFAULT: '#10B981', // emerald green (passport verified states)
          light: '#34D399',
          dark: '#059669',
        },
        error: {
          DEFAULT: '#F43F5E', // rose (failed states)
          light: '#FB7185',
          dark: '#E11D48',
        },
        background: '#0F172A', // Very dark slate for overall modern feel
        surface: '#1E293B',
        text: '#F8FAFC',
        muted: '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
