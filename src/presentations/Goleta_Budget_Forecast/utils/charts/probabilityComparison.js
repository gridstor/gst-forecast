import { createChartOptions } from './baseConfig'
import { Chart } from 'chart.js'

export const goletaChartData = {
  labels: ['Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'],
  datasets: [
    {
      label: 'Probability Range, bar P25 to P75, whiskers P5 to P95',
      backgroundColor: '#0B2B5B33',
      barPercentage: 0.3,
      data: [
        // Winter months have more downside risk (Dec-Feb)
        { x: 'Feb-25', y: [(5.07 * 0.7 * 0.8), (5.07 * 1.2 * 0.8)], p50: (5.07 * 1.02 * 0.8), whisker: [(5.07 * 0.5 * 0.8), (5.07 * 1.4 * 0.8)] },
        { x: 'Mar-25', y: [(7.31 * 0.75 * 0.8), (7.31 * 1.25 * 0.8)], p50: (7.31 * 0.98 * 0.8), whisker: [(7.31 * 0.55 * 0.8), (7.31 * 1.45 * 0.8)] },
        { x: 'Apr-25', y: [(7.57 * 0.75 * 0.8), (7.57 * 1.3 * 0.8)], p50: (7.57 * 1.03 * 0.8), whisker: [(7.57 * 0.55 * 0.8), (7.57 * 1.5 * 0.8)] },
        // Summer months have more upside potential (Jun-Aug)
        { x: 'May-25', y: [(6.03 * 0.8 * 0.8), (6.03 * 1.4 * 0.8)], p50: (6.03 * 0.97 * 0.8), whisker: [(6.03 * 0.6 * 0.8), (6.03 * 1.6 * 0.8)] },
        { x: 'Jun-25', y: [(6.45 * 0.8 * 0.8), (6.45 * 1.5 * 0.8)], p50: (6.45 * 1.04 * 0.8), whisker: [(6.45 * 0.6 * 0.8), (6.45 * 1.8 * 0.8)] },
        { x: 'Jul-25', y: [(6.19 * 0.8 * 0.8), (6.19 * 1.6 * 0.8)], p50: (6.19 * 0.96 * 0.8), whisker: [(6.19 * 0.6 * 0.8), (6.19 * 2.0 * 0.8)] },
        { x: 'Aug-25', y: [(7.69 * 0.8 * 0.8), (7.69 * 1.6 * 0.8)], p50: (7.69 * 1.05 * 0.8), whisker: [(7.69 * 0.6 * 0.8), (7.69 * 2.0 * 0.8)] },
        { x: 'Sep-25', y: [(6.21 * 0.8 * 0.8), (6.21 * 1.5 * 0.8)], p50: (6.21 * 0.95 * 0.8), whisker: [(6.21 * 0.6 * 0.8), (6.21 * 1.8 * 0.8)] },
        { x: 'Oct-25', y: [(6.50 * 0.55 * 0.8), (6.50 * 1.35 * 0.8)], p50: (6.50 * 1.02 * 0.8), whisker: [(6.50 * 0.35 * 0.8), (6.50 * 1.55 * 0.8)] },
        { x: 'Nov-25', y: [(5.11 * 0.50 * 0.8), (5.11 * 1.3 * 0.8)], p50: (5.11 * 0.97 * 0.8), whisker: [(5.11 * 0.30 * 0.8), (5.11 * 1.5 * 0.8)] },
        { x: 'Dec-25', y: [(5.59 * 0.45 * 0.8), (5.59 * 1.25 * 0.8)], p50: (5.59 * 1.03 * 0.8), whisker: [(5.59 * 0.25 * 0.8), (5.59 * 1.45 * 0.8)] }
      ],
      type: 'bar',
      order: 2
    },
    {
      label: 'P50 Simulation Run',
      backgroundColor: '#0B2B5B',
      borderColor: '#0B2B5B',
      data: [
        (3.78 * 0.8),
        (5.07 * 1.02 * 0.8),
        (7.31 * 0.98 * 0.8),
        (7.57 * 1.03 * 0.8),
        (6.03 * 0.97 * 0.8),
        (6.45 * 1.04 * 0.8),
        (6.19 * 0.96 * 0.8),
        (7.69 * 1.05 * 0.8),
        (6.21 * 0.95 * 0.8),
        (6.50 * 1.02 * 0.8),
        (5.11 * 0.97 * 0.8),
        (5.59 * 1.03 * 0.8)
      ],
      type: 'line',
      borderWidth: 2,
      pointRadius: 0,
      order: 1
    },
    {
      label: '2025 - Actual',
      backgroundColor: '#FFA500',
      borderColor: '#FFA500',
      data: [(3.78 * 0.8), null, null, null, null, null, null, null, null, null, null, null],
      pointStyle: 'star',
      pointRadius: 12,
      type: 'scatter',
      order: 0,
      datalabels: {
        align: 'top',
        anchor: 'bottom',
        offset: 10,
        formatter: () => `$${(3.78 * 0.8).toFixed(2)} P22`,
        font: {
          weight: 'bold'
        }
      }
    },
    {
      label: '2024 - Actuals',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 0.5)',
      data: [3.3, 3.49, 5.76, 5.75, 4.44, 3.2, 6.16, 4.1, 4.74, 3.28, 3.06, 1.9],
      pointStyle: 'circle',
      pointRadius: 6,
      type: 'scatter',
      order: 0
    }
  ]
}

// Add custom plugin to draw whiskers and bar midpoints
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
        
        // Draw whisker lines - these extend beyond the box
        const whiskerBottom = yScale.getPixelForValue(dataPoint.whisker[0]);
        const whiskerTop = yScale.getPixelForValue(dataPoint.whisker[1]);
        
        // Set very transparent style for whiskers
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(11, 43, 91, 0.25)';
        
        // Draw whisker top cap
        ctx.beginPath();
        ctx.moveTo(x - 12, whiskerTop);
        ctx.lineTo(x + 12, whiskerTop);
        ctx.stroke();
        
        // Draw whisker bottom cap
        ctx.beginPath();
        ctx.moveTo(x - 12, whiskerBottom);
        ctx.lineTo(x + 12, whiskerBottom);
        ctx.stroke();
        
        // Draw vertical whisker lines
        ctx.beginPath();
        ctx.moveTo(x, whiskerBottom);
        ctx.lineTo(x, whiskerTop);
        ctx.stroke();

        ctx.restore();

        // Draw median line with original color
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
        ctx.fillStyle = '#666666';  // Light gray color
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

// Register the plugin globally
Chart.register(boxWhiskerPlugin);

// Calculate averages
const p50Average = goletaChartData.datasets[1].data.reduce((a, b) => a + b, 0) / 12;
const actualsAverage = goletaChartData.datasets[3].data.reduce((a, b) => a + b, 0) / 12;
const rangeAverage = goletaChartData.datasets[0].data.reduce((a, b) => a + (b.y[0] + b.y[1])/2, 0) / 12;

export const chartOptions = {
  ...createChartOptions('$/kw-mn'),
  maintainAspectRatio: false,
  responsive: true,
  layout: {
    padding: {
      top: 10,
      right: 15,
      bottom: 15,
      left: 10
    }
  },
  plugins: {
    ...createChartOptions('$/kw-mn').plugins,
    boxWhisker: {
      enabled: true
    },
    legend: {
      position: 'top',
      align: 'start',
      labels: {
        boxWidth: 12,
        padding: 8,
        font: {
          size: 10
        },
        filter: function(legendItem, data) {
          return legendItem.text !== 'P50 Markers';
        }
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
      suggestedMax: Math.max(...goletaChartData.datasets[0].data.map(d => d.whisker[1])) * 1.1,
      title: {
        display: true,
        text: '$/kw-mn',
        color: '#0B2B5B',
        font: {
          size: 10
        }
      },
      ticks: {
        color: '#0B2B5B',
        font: {
          size: 10
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#0B2B5B',
        font: {
          size: 10
        },
        maxRotation: 45,
        minRotation: 45
      }
    }
  }
} 