<script setup>
import { ref, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartData = ref({
  labels: ['Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'],
  datasets: [
    {
      label: 'Energy Arb',
      backgroundColor: 'skyblue',
      data: [3.04, 4.16, 7.35, 8.41, 4.92, 6.64, 5.03, 8.91, 4.99, 6.57, 3.95, 4.81],
      stack: 'stack1',
      datalabels: { display: false }
    },
    {
      label: 'AS Revenue (0.14 cycles)',
      backgroundColor: 'orange',
      data: [1.82, 1.83, 1.10, 1.26, 1.26, 0.66, 1.25, 0.89, 1.24, 0.66, 1.30, 1.27],
      stack: 'stack1',
      datalabels: { display: false }
    },
    {
      label: 'Energy Arb',
      backgroundColor: 'skyblue',
      data: [3.04, 4.16, 7.35, 8.41, 4.92, 6.64, 5.03, 8.91, 4.99, 6.57, 3.95, 4.81],
      stack: 'stack2',
      datalabels: { display: false }
    },
    {
      label: 'AS Revenue (0.3 cycles)',
      backgroundColor: 'red',
      data: [3.04, 2.66, 2.11, 1.88, 2.80, 2.21, 2.81, 1.75, 2.80, 2.18, 2.60, 2.79],
      stack: 'stack2',
      datalabels: { display: false }
    }
  ]
});

const options = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'start',
      labels: {
        boxWidth: 15,
        padding: 8,
        font: { size: 10 },
        filter: function(legendItem, data) {
          if (legendItem.text === 'Energy Arb') {
            return data.datasets.findIndex(ds => ds.label === 'Energy Arb') === data.datasets.indexOf(legendItem.datasetIndex);
          }
          return true;
        }
      }
    },
    datalabels: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: $${value.toFixed(2)}/kW-month`;
        },
        footer: function(tooltipItems) {
          const stackId = tooltipItems[0].dataset.stack;
          const total = tooltipItems
            .filter(item => item.dataset.stack === stackId)
            .reduce((sum, item) => sum + item.parsed.y, 0);
          return `Total: $${total.toFixed(2)}/kW-month`;
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      ticks: {
        font: { size: 10 },
        maxRotation: 45,
        minRotation: 45
      },
      grid: {
        display: false
      }
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: '$/kW-month',
        font: { size: 12 },
        padding: { bottom: 10 }
      },
      ticks: {
        font: { size: 10 },
        callback: function(value) {
          return '$' + value.toFixed(2);
        }
      },
      grid: {
        color: '#e5e5e5'
      }
    }
  }
});
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-container">
      <Bar :data="chartData" :options="options" />
    </div>
    <div class="summary-box">
      <h3>Averages for 2025</h3>
      <p><strong>1.0 cycle per day:</strong> $6.88</p>
      <p class="indent">• Energy Arb: $5.73</p>
      <p class="indent">• AS Revenue (0.14): $1.15</p>
      <br />
      <p><strong>1.2 cycles per day:</strong> $8.20</p>
      <p class="indent">• Energy Arb: $5.73</p>
      <p class="indent">• AS Revenue (0.3): $2.47</p>
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 20px;
  padding: 5px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 300px;
}

.chart-container {
  flex: 1;
  height: 100%;
}

.summary-box {
  width: 180px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 12px;
}

.summary-box h3 {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.summary-box p {
  margin: 4px 0;
}

.indent {
  padding-left: 12px;
  color: #666;
}
</style>