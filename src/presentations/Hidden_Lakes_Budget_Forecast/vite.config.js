import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/presentations/Hidden_Lakes_Budget_Forecast/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  optimizeDeps: {
    include: ['vue-chartjs', 'chart.js', 'chartjs-plugin-datalabels']
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    __VUE_PROD_DEVTOOLS__: 'false'
  },
  build: {
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'chart.js': ['chart.js', 'vue-chartjs', 'chartjs-plugin-datalabels']
        }
      }
    }
  }
}) 