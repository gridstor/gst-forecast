/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'gs-blue': '#34D5ED',
        'gs-dark': '#107D87'
      }
    },
  },
  plugins: [],
} 