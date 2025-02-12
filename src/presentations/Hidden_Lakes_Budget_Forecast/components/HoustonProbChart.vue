<script setup>
import { ref, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  BarController,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js'
import { houstonChartData, chartOptions } from '../utils/charts/probabilityComparison'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

// Ensure Vue is in production mode
if (process.env.NODE_ENV === 'production') {
  const vue = await import('vue')
  vue.config.productionTip = false
  vue.config.devtools = false
}

const chartData = ref(houstonChartData)
const options = ref({
  ...chartOptions,
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 2,
  plugins: {
    ...chartOptions.plugins,
    legend: {
      position: 'top',
      labels: {
        boxWidth: 12,
        padding: 8,
        font: { size: 10 }
      }
    }
  }
})

onMounted(() => {
  // Force a redraw after mounting
  chartData.value = { ...houstonChartData }
})

const handleDownload = () => {
  const csvContent = 'data:text/csv;charset=utf-8,' + 
    chartData.value.labels.map((label, idx) => {
      return `${label},${chartData.value.datasets.map(ds => ds.data[idx]).join(',')}`
    }).join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'hidden_lakes_price_distribution.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="chart-wrapper">
    <button class="download-btn" @click="handleDownload">
      Download Data
    </button>
    <div class="chart-container">
      <Line :data="chartData" :options="options" />
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 350px;
  width: 100%;
  margin: 10px auto;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.chart-container {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.download-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px 16px;
  background-color: #0B2B5B;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  z-index: 1;
}

.download-btn:hover {
  background-color: #1a4b8f;
}
</style> 