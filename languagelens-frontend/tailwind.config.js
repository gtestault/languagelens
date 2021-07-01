module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      maxWidth: {
        "1/3": "33.333333%"
      },
      gridTemplateColumns: {
        'files': 'repeat(2, minmax(200px, 1fr));',
      }
    },
  },
  variants: {
    extend: {
    },
  },
  plugins: [],
}
