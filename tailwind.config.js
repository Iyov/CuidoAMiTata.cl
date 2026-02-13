/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./js/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#10b981', // Verde esmeralda suave
        'primary-dark': '#059669', // Verde más oscuro para hover
      }
    },
  },
  plugins: [],
}
