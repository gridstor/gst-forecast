import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'node_modules', 
      'dist', 
      '.astro',
      'src/presentations/**',
      '**/node_modules/**',
      'src/presentations/**/node_modules/**'
    ],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        'src/types/',
        'src/presentations/**',
        '**/*.d.ts',
        'astro.config.mjs',
        'tailwind.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/components': '/src/components',
      '@/lib': '/src/lib',
      '@/types': '/src/types'
    }
  }
}) 