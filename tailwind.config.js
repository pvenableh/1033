const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}',
    `./App.{js,ts,vue}`,
    `./app.{js,ts,vue}`,
    `./nuxt.config.{js,ts}`,
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.violet,
        gray: colors.slate,
      }, 
      letterSpacing: {
        tightest: '-.075em',
        tighter: '-.05em',
        tight: '-.025em',
        normal: '0',
        wide: '.1em',
        wider: '.2em',
        widest: '.4em',
      },
      fontFamily: {
        sans: [
          'Proxima Nova W01 Light',
          '-apple-system',
          'Roboto',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        body: [
          'Proxima Nova W01 Light',
          '-apple-system',
          'Roboto',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        bold: [
          'Proxima Nova W01 Regular',
          '-apple-system',
          'Roboto',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        light: [
          'Proxima Nova W01 Thin',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        serif: [
          'Bauer Bodoni Pro_1 W05 Roman',
          'Times',
          'Times New Roman',
          'serif',
        ],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
