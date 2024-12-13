/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'gs-dark': '#2A2A2A',
        'gs-blue': '#34D5ED',
      }
    }
  }
} 