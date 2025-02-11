<script setup>
import { ref, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// Register Chart.js components
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

const chartData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Probability Range',
      backgroundColor: '#0B2B5B33',
      barPercentage: 0.3,
      data: [
        { x: 'Jan', y: [6.18 * 0.4, 6.18 * 1.6], p50: 6.18 * 0.85, whisker: [6.18 * 0.2, 6.18 * 2.4], pValue: 'P45' },
        { x: 'Feb', y: [1.42 * 0.8, 1.42 * 3.2], p50: 1.42 * 1.40, whisker: [1.42 * 0.4, 1.42 * 3.6], pValue: 'P42' },
        { x: 'Mar', y: [3.00 * 0.4, 3.00 * 1.8], p50: 3.00 * 1.08, whisker: [3.00 * 0.3, 3.00 * 2.0], pValue: 'P48' },
        { x: 'Apr', y: [4.85 * 0.4, 4.85 * 1.7], p50: 4.85 * 0.93, whisker: [4.85 * 0.3, 4.85 * 1.9], pValue: 'P52' },
        { x: 'May', y: [12.57 * 0.45, 12.57 * 1.15], p50: 12.57 * 0.75, whisker: [12.57 * 0.25, 12.57 * 1.35], pValue: 'P80' },
        { x: 'Jun', y: [3.43 * 0.4, 3.43 * 2.2], p50: 3.43 * 1.25, whisker: [3.43 * 0.2, 3.43 * 2.6], pValue: 'P38' },
        { x: 'Jul', y: [2.00 * 1.03, 2.00 * 3.07], p50: 2.00 * 1.75, whisker: [2.00 * 0.41, 2.00 * 4.02], pValue: 'P35' },
        { x: 'Aug', y: [6.68 * 0.6, 6.68 * 2.0], p50: 6.68 * 1.12, whisker: [6.68 * 0.4, 6.68 * 2.4], pValue: 'P55' },
        { x: 'Sep', y: [2.03 * 0.9, 2.03 * 3.1], p50: 2.03 * 1.75, whisker: [2.03 * 0.7, 2.03 * 4.2], pValue: 'P32' },
        { x: 'Oct', y: [3.99 * 0.4, 3.99 * 2.0], p50: 3.99 * 1.15, whisker: [3.99 * 0.2, 3.99 * 2.4], pValue: 'P42' },
        { x: 'Nov', y: [2.58 * 0.4, 2.58 * 2.0], p50: 2.58 * 1.15, whisker: [2.58 * 0.2, 2.58 * 3.0], pValue: 'P38' },
        { x: 'Dec', y: [1.68 * 0.4, 1.68 * 2.2], p50: 1.68 * 1.45, whisker: [1.68 * 0.2, 1.68 * 2.6], pValue: 'P35' }
      ],
      type: 'bar',
      order: 2
    },
    {
      label: 'P50 Forecast',
      backgroundColor: '#0B2B5B',
      borderColor: '#0B2B5B',
      data: [6.18 * 0.85, 1.42 * 1.40, 3.00 * 1.08, 4.85 * 0.93, 12.57 * 0.65, 3.43 * 1.25, 2.00 * 2.50, 6.68 * 1.12, 2.03 * 2.60, 3.99 * 1.15, 2.58 * 1.15, 1.68 * 1.45],
      type: 'line',
      borderWidth: 2,
      pointRadius: 4,
      order: 1
    },
    {
      label: '2024 Actuals',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 0.5)',
      data: [6.18, 1.42, 3.00, 4.85, 12.57, 3.43, 2.00, 6.68, 2.03, 3.99, 2.58, 1.68],
      type: 'line',
      borderWidth: 2,
      borderDash: [5, 5],
      pointStyle: 'circle',
      pointRadius: 6,
      order: 0
    }
  ]
})

const options = ref({
  maintainAspectRatio: false,
  responsive: true,
  animation: false,
  layout: {
    padding: {
      top: 15,
      right: 15,
      bottom: 10,
      left: 10
    }
  },
  plugins: {
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

        // Draw bar midpoint as a diamond
        ctx.save();
        const diamondSize = 6;
        ctx.fillStyle = '#666666';  // Dark gray color
        const barMidpoint = yScale.getPixelForValue((dataPoint.y[0] + dataPoint.y[1]) / 2);  // Midpoint of box (P25-P75)
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
    'Whisker High (P95)',
    '2024 Actual',
    'P-Value'
  ].join(',');

  // Create CSV rows
  const rows = chartData.value.labels.map((month, idx) => {
    const rangeData = chartData.value.datasets[0].data[idx];
    const p50Data = chartData.value.datasets[1].data[idx];
    const actualData = chartData.value.datasets[2].data[idx];
    const midpoint = (rangeData.y[0] + rangeData.y[1]) / 2;

    return [
      month,
      rangeData.y[0].toFixed(2),
      rangeData.y[1].toFixed(2),
      midpoint.toFixed(2),
      p50Data.toFixed(2),
      rangeData.whisker[0].toFixed(2),
      rangeData.whisker[1].toFixed(2),
      actualData.toFixed(2),
      rangeData.pValue
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'houston_calibration_data.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const getDifference = (index) => {
  const actual = chartData.value.datasets[2].data[index];  // 2024 Actuals dataset
  const rangeData = chartData.value.datasets[0].data[index];  // Probability Range dataset
  const p50Value = rangeData.p50;  // Get the P50 forecast value
  const actualDiff = actual - p50Value;  // Calculate difference between actual and P50
  return actualDiff;
}

const formatDifference = (diff) => {
  if (Math.abs(diff) < 0.01) return '$0.00';
  return diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`;
}
</script>

<template>
  <div class="chart-wrapper">
    <div class="p-value-container">
      <div class="p-value-title">P-value of Actual Outcome vs. Forecast Probability Range</div>
      <div class="p-value-table">
        <div v-for="(month, index) in chartData.labels" :key="month" class="p-value-cell">
          <div class="month">{{ month }}</div>
          <div class="p-value">{{ chartData.datasets[0].data[index].pValue }}</div>
          <div class="difference" :class="{ 'positive': getDifference(index) > 0 }">
            {{ formatDifference(getDifference(index)) }}
          </div>
        </div>
      </div>
    </div>
    <button class="download-btn" @click="handleDownload">
      Download Data
    </button>
    <div class="chart-content">
      <Line :data="chartData" :options="options" />
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 350px;
  width: 100%;
  margin: 0;
  padding: 2px 2px 10px 2px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.p-value-container {
  flex: 0 0 auto;
  background: white;
  padding: 1px;
  border-bottom: 1px solid #eee;
  margin-bottom: 2px;
}

.p-value-title {
  text-align: center;
  font-weight: bold;
  color: #0B2B5B;
  font-size: 7px;
  margin-bottom: 1px;
}

.p-value-table {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 1px;
}

.p-value-cell {
  font-weight: bold;
  font-size: 7px;
  color: #0B2B5B;
  text-align: center;
  padding: 1px 2px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.month {
  font-size: 6px;
  color: #666;
}

.p-value {
  font-size: 8px;
  color: #0B2B5B;
}

.download-btn {
  position: absolute;
  top: 0;
  right: 0;
  padding: 3px 6px;
  background-color: #0B2B5B;
  color: white;
  border: none;
  border-radius: 0 8px 0 4px;
  cursor: pointer;
  font-size: 8px;
  z-index: 1;
}

.download-btn:hover {
  background-color: #1a4b8f;
}

.chart-content {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  margin-top: -5px;
  margin-bottom: 10px;
  padding-bottom: 5px;
}

.difference {
  font-size: 6px;
  color: #d32f2f;
}

.difference.positive {
  color: #388e3c;
}
</style> 