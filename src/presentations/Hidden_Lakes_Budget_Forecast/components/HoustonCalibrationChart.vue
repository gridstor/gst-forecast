<script setup>
import { ref } from 'vue'
import { Bar } from 'vue-chartjs'
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
  BarController
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

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

ChartJS.register(boxWhiskerPlugin);

const chartData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Probability Range',
      backgroundColor: '#0B2B5B33',
      barPercentage: 0.3,
      data: [
        { x: 'Jan', y: [3.3 * 0.55, 3.3 * 1.3], p50: 3.3 * 1.05, whisker: [3.3 * 0.35, 3.3 * 1.5], pValue: 'P57' },
        { x: 'Feb', y: [3.49 * 0.65, 3.49 * 1.4], p50: 3.49 * 0.95, whisker: [3.49 * 0.45, 3.49 * 1.6], pValue: 'P47' },
        { x: 'Mar', y: [5.76 * 0.63, 5.76 * 1.18], p50: 5.76 * 1.08, whisker: [5.76 * 0.45, 5.76 * 1.4], pValue: 'P60' },
        { x: 'Apr', y: [5.75 * 0.65, 5.75 * 1.2], p50: 5.75 * 0.93, whisker: [5.75 * 0.45, 5.75 * 1.4], pValue: 'P55' },
        { x: 'May', y: [4.44 * 0.8, 4.44 * 1.4], p50: 4.44 * 1.06, whisker: [4.44 * 0.6, 4.44 * 1.6], pValue: 'P43' },
        { x: 'Jun', y: [3.2 * 0.60, 3.2 * 1.8], p50: 3.2 * 1.25, whisker: [3.2 * 0.35, 3.2 * 2.3], pValue: 'P40' },
        { x: 'Jul', y: [6.16 * 0.60, 6.16 * 1.23], p50: 6.16 * 1.12, whisker: [6.16 * 0.45, 6.16 * 1.45], pValue: 'P55' },
        { x: 'Aug', y: [4.1 * 0.8, 4.1 * 1.6], p50: 4.1 * 1.12, whisker: [4.1 * 0.6, 4.1 * 2.0], pValue: 'P35' },
        { x: 'Sep', y: [4.74 * 0.9, 4.74 * 1.7], p50: 4.74 * 1.15, whisker: [4.74 * 0.7, 4.74 * 2.0], pValue: 'P28' },
        { x: 'Oct', y: [3.28 * 0.50, 3.28 * 1.55], p50: 3.28 * 1.15, whisker: [3.28 * 0.25, 3.28 * 2.1], pValue: 'P45' },
        { x: 'Nov', y: [3.06 * 0.60, 3.06 * 1.5], p50: 3.06 * 1.15, whisker: [3.06 * 0.40, 3.06 * 1.8], pValue: 'P45' },
        { x: 'Dec', y: [1.9 * 0.50, 1.9 * 1.85], p50: 1.9 * 1.45, whisker: [1.9 * 0.25, 1.9 * 2.5], pValue: 'P40' }
      ],
      type: 'bar',
      order: 2
    },
    {
      label: 'P50 Forecast',
      backgroundColor: '#0B2B5B',
      borderColor: '#0B2B5B',
      data: [3.3 * 1.05, 3.49 * 0.95, 5.76 * 1.08, 5.75 * 0.93, 4.44 * 1.06, 3.2 * 1.25, 6.16 * 1.12, 4.1 * 1.12, 4.74 * 1.15, 3.28 * 1.15, 3.06 * 1.15, 1.9 * 1.45],
      type: 'line',
      borderWidth: 2,
      pointRadius: 4,
      order: 1
    },
    {
      label: '2024 Actuals',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 0.5)',
      data: [3.3, 3.49, 5.76, 5.75, 4.44, 3.2, 6.16, 4.1, 4.74, 3.28, 3.06, 1.9],
      type: 'line',
      borderWidth: 2,
      borderDash: [5, 5],
      pointStyle: 'circle',
      pointRadius: 6,
      order: 0
    }
  ]
})

const chartOptions = ref({
  maintainAspectRatio: false,
  responsive: true,
  layout: {
    padding: {
      top: 15,
      right: 15,
      bottom: 10,
      left: 10
    }
  },
  plugins: {
    boxWhisker: {
      enabled: true
    },
    datalabels: {
      display: false
    },
    legend: {
      display: true,
      position: 'top',
      align: 'center',
      labels: {
        boxWidth: 6,
        padding: 3,
        font: { size: 8 }
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
                `${label} P25: $${dataPoint.y[0].toFixed(2)}`,
                `${label} P75: $${dataPoint.y[1].toFixed(2)}`,
                `P50: $${dataPoint.p50.toFixed(2)}`,
                `P5: $${dataPoint.whisker[0].toFixed(2)}`,
                `P95: $${dataPoint.whisker[1].toFixed(2)}`,
                `Actual: ${dataPoint.pValue}`
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
      grid: {
        drawBorder: false
      },
      beginAtZero: true,
      title: {
        display: true,
        text: '$/kw-mn',
        color: '#0B2B5B',
        font: { size: 8 },
        padding: { bottom: 5 }
      },
      ticks: {
        color: '#0B2B5B',
        font: { size: 8 },
        padding: 3
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        color: '#0B2B5B',
        font: { size: 8 },
        padding: 3
      }
    }
  }
})

const handleDownload = () => {
  const csvContent = 'data:text/csv;charset=utf-8,' + 
    chartData.value.labels.map((label, idx) => {
      return `${label},${chartData.value.datasets.map(ds => ds.data[idx]).join(',')}`
    }).join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'houston_calibration.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const getDifference = (index) => {
  const actual = chartData.value.datasets[2].data[index];
  const rangeData = chartData.value.datasets[0].data[index];
  const rangeMidpoint = (rangeData.y[0] + rangeData.y[1]) / 2;
  return actual - rangeMidpoint;
}

const formatDifference = (diff) => {
  return diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`;
}

const getAverages = () => {
  const pValues = chartData.value.datasets[0].data.map(d => parseInt(d.pValue.substring(1)));
  const differences = chartData.value.labels.map((_, i) => getDifference(i));
  
  const avgPValue = pValues.reduce((a, b) => a + b, 0) / pValues.length;
  const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
  
  return {
    avgPValue: avgPValue.toFixed(0),
    avgDiff: avgDiff.toFixed(2)
  };
}
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-container {
  width: 80%;
  height: 80%;
}
</style> 