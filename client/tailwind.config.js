export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        urban: ['Urbanist', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        purple: { DEFAULT: '#7c3aed', dark: '#6d28d9', light: '#8b5cf6' },
        gold: { DEFAULT: '#f5c842', light: '#ffd84d' },
      },
    },
  },
  plugins: [],
}
