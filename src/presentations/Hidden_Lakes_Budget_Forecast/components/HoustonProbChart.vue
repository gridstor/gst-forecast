<script setup>
import { ref, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineController,
  BarController,
  ScatterController
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

const chartData = ref({
  labels: ['Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'],
  datasets: [
    {
      label: 'Probability Range, bar P25 to P75, whiskers P5 to P95',
      backgroundColor: '#0B2B5B33',
      barPercentage: 0.3,
      data: [
        { x: 'Jan-25', y: [3.04 * 0.7, 3.04 * 1.2], p50: 3.04 * 1.02, whisker: [3.04 * 0.5, 3.04 * 1.4] },
        { x: 'Feb-25', y: [4.16 * 0.75, 4.16 * 1.25], p50: 4.16 * 0.98, whisker: [4.16 * 0.55, 4.16 * 1.45] },
        { x: 'Mar-25', y: [7.35 * 0.75, 7.35 * 1.3], p50: 7.35 * 1.03, whisker: [7.35 * 0.55, 7.35 * 1.5] },
        { x: 'Apr-25', y: [8.41 * 0.8, 8.41 * 1.4], p50: 8.41 * 0.97, whisker: [8.41 * 0.6, 8.41 * 1.6] },
        { x: 'May-25', y: [4.92 * 0.8, 4.92 * 1.5], p50: 4.92 * 1.04, whisker: [4.92 * 0.6, 4.92 * 1.8] },
        { x: 'Jun-25', y: [6.64 * 0.8, 6.64 * 1.6], p50: 6.64 * 0.96, whisker: [6.64 * 0.6, 6.64 * 2.0] },
        { x: 'Jul-25', y: [5.03 * 0.8, 5.03 * 1.6], p50: 5.03 * 1.05, whisker: [5.03 * 0.6, 5.03 * 2.0] },
        { x: 'Aug-25', y: [8.91 * 0.8, 8.91 * 1.5], p50: 8.91 * 0.95, whisker: [8.91 * 0.6, 8.91 * 1.8] },
        { x: 'Sep-25', y: [4.99 * 0.55, 4.99 * 1.35], p50: 4.99 * 1.02, whisker: [4.99 * 0.35, 4.99 * 1.55] },
        { x: 'Oct-25', y: [6.57 * 0.50, 6.57 * 1.3], p50: 6.57 * 0.97, whisker: [6.57 * 0.30, 6.57 * 1.5] },
        { x: 'Nov-25', y: [3.95 * 0.45, 3.95 * 1.25], p50: 3.95 * 1.03, whisker: [3.95 * 0.25, 3.95 * 1.45] },
        { x: 'Dec-25', y: [4.81 * 0.45, 4.81 * 1.25], p50: 4.81 * 1.03, whisker: [4.81 * 0.25, 4.81 * 1.45] }
      ],
      type: 'bar',
      order: 2
    },
    {
      label: 'P50 Simulation Run',
      backgroundColor: '#0B2B5B',
      borderColor: '#0B2B5B',
      data: [
        3.04 * 1.02,
        4.16 * 0.98,
        7.35 * 1.03,
        8.41 * 0.97,
        4.92 * 1.04,
        6.64 * 0.96,
        5.03 * 1.05,
        8.91 * 0.95,
        4.99 * 1.02,
        6.57 * 0.97,
        3.95 * 1.03,
        4.81 * 1.03
      ],
      type: 'line',
      borderWidth: 2,
      pointRadius: 0,
      order: 1
    },
    {
      label: '2024 - Actual',
      backgroundColor: '#FFA500',
      borderColor: '#FFA500',
      data: [{ x: 'Jan-25', y: 2.73 }],
      pointStyle: 'star',
      pointRadius: 12,
      type: 'scatter',
      order: 0,
      datalabels: {
        align: 'top',
        anchor: 'bottom',
        offset: 10,
        formatter: () => '$6.18 P45',
        font: {
          weight: 'bold'
        }
      }
    }
  ]
})

const options = ref({
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 2,
  plugins: {
    datalabels: {
      display: function(context) {
        return context.dataset.type === 'scatter';
      }
    },
    legend: {
      position: 'top',
      labels: {
        boxWidth: 12,
        padding: 8,
        font: { size: 10 }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || '';
          if (context.parsed.y !== null) {
            if (context.dataset.type === 'bar') {
              const dataPoint = context.dataset.data[context.dataIndex];
              return [
                `${label} Low: $${dataPoint.y[0].toFixed(2)}`,
                `${label} High: $${dataPoint.y[1].toFixed(2)}`,
                `P50: $${dataPoint.p50.toFixed(2)}`,
                `Whisker Low: $${dataPoint.whisker[0].toFixed(2)}`,
                `Whisker High: $${dataPoint.whisker[1].toFixed(2)}`
              ];
            }
            return `${label}: $${context.parsed.y.toFixed(2)}`;
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '$/kw-mn',
        color: '#0B2B5B',
        font: { size: 10 }
      },
      ticks: {
        color: '#0B2B5B',
        font: { size: 10 }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#0B2B5B',
        font: { size: 10 },
        maxRotation: 45,
        minRotation: 45
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

        // Draw bar midpoint as a diamond
        ctx.save();
        const diamondSize = 6;
        ctx.fillStyle = '#666666';  // Dark gray color
        const barMidpoint = yScale.getPixelForValue((dataPoint.y[0] + dataPoint.y[1]) / 2);
        ctx.beginPath();
        ctx.moveTo(x, barMidpoint - diamondSize); // Top point
        ctx.lineTo(x + diamondSize, barMidpoint); // Right point
        ctx.lineTo(x, barMidpoint + diamondSize); // Bottom point
        ctx.lineTo(x - diamondSize, barMidpoint); // Left point
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    });
  }
};

ChartJS.register(boxWhiskerPlugin)

const handleDownload = () => {
  // Create CSV header
  const headers = [
    'Month',
    'Box Low (P25)',
    'Box High (P75)',
    'Month Midpoint',
    'P50 Forecast',
    'Whisker Low (P5)',
    'Whisker High (P95)'
  ].join(',');

  // Create CSV rows
  const rows = chartData.value.labels.map((month, idx) => {
    const rangeData = chartData.value.datasets[0].data[idx];
    const p50Data = chartData.value.datasets[1].data[idx];
    const midpoint = (rangeData.y[0] + rangeData.y[1]) / 2;

    return [
      month,
      rangeData.y[0].toFixed(2),
      rangeData.y[1].toFixed(2),
      midpoint.toFixed(2),
      p50Data.toFixed(2),
      rangeData.whisker[0].toFixed(2),
      rangeData.whisker[1].toFixed(2)
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'houston_probability_data.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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