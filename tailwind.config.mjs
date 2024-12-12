/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'brand': {
          primary: '#2FFFD9',
          'primary-dark': '#00D6B0',
          secondary: '#2A2A2A',
          'secondary-light': '#404040'
        }
      },
      fontFamily: {
        sans: ['Inter Variable', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            a: {
              color: '#2FFFD9',
              '&:hover': {
                color: '#00D6B0',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}