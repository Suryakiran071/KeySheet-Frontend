/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0284c7',
          600: '#0369a1',
          900: '#0c4a6e',
        },
        stage: {
          bg: '#0f172a',     // Dark stage background
          card: '#1e293b',   // Stage card background
          accent: '#38bdf8', // Neon blue for chords
          text: '#f8fafc'    // High-contrast text
        }
      }
    },
  },
  plugins: [],
}