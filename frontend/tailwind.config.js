/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // My-Music-Company Design Tokens
        // Extrahiert aus https://www.my-music-company.com
        mmc: {
          primary:   '#C8102E', // Corporate Red (Hauptfarbe)
          secondary: '#1A1A1A', // Deep Black (Sekundär)
          accent:    '#E8B800', // Gold/Yellow Accent
          light:     '#F5F5F5', // Light Background
          white:     '#FFFFFF',
          gray:      '#6B7280',
          'primary-dark':  '#9B0D22', // Darker Red (Hover)
          'primary-light': '#F9E5E8', // Light Red (Background)
        },
      },
      fontFamily: {
        // My-Music-Company nutzt serifenlose Schriften
        mmc: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
