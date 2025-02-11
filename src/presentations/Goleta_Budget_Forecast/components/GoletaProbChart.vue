<script setup>
import { ref, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js'
import { goletaChartData, chartOptions } from '../utils/charts/probabilityComparison'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ChartDataLabels
)

const chartData = ref(goletaChartData)
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

// Define box-whisker plugin
const boxWhiskerPlugin = {
  id: 'boxWhisker',
  beforeDatasetsDraw: (chart, args, options) => {
    const { ctx } = chart;
    
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if (!dataset.data[0]?.whisker) return;

      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta.visible) return;

      dataset.data.forEach((dataPoint, index) => {
        if (!dataPoint.whisker) return;
        
        const element = meta.data[index];
        if (!element) return;
        
        const { x } = element.getCenterPoint();
        const yScale = chart.scales.y;
        
        // Draw whisker lines
        const whiskerBottom = yScale.getPixelForValue(dataPoint.whisker[0]);
        const whiskerTop = yScale.getPixelForValue(dataPoint.whisker[1]);
        
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(11, 43, 91, 0.25)';
        
        // Draw whisker caps
        ctx.beginPath();
        ctx.moveTo(x - 12, whiskerTop);
        ctx.lineTo(x + 12, whiskerTop);
        ctx.moveTo(x - 12, whiskerBottom);
        ctx.lineTo(x + 12, whiskerBottom);
        ctx.stroke();
        
        // Draw vertical whisker line
        ctx.beginPath();
        ctx.moveTo(x, whiskerBottom);
        ctx.lineTo(x, whiskerTop);
        ctx.stroke();

        ctx.restore();

        // Draw median line
        ctx.save();
        ctx.strokeStyle = '#0B2B5B';
        ctx.lineWidth = 3;
        const medianY = yScale.getPixelForValue(dataPoint.p50);
        ctx.beginPath();
        ctx.moveTo(x - 15, medianY);
        ctx.lineTo(x + 15, medianY);
        ctx.stroke();
        ctx.restore();
      });
    });
  }
};

ChartJS.register(boxWhiskerPlugin)

onMounted(() => {
  // Force a redraw after mounting
  chartData.value = { ...goletaChartData }
})

const handleDownload = () => {
  const csvContent = 'data:text/csv;charset=utf-8,' + 
    chartData.value.labels.map((label, idx) => {
      return `${label},${chartData.value.datasets.map(ds => ds.data[idx]).join(',')}`
    }).join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'goleta_price_distribution.csv')
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