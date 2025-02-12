// Sample data for the Hidden Lakes calibration chart
export const houstonCalibrationData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Probability Range',
      backgroundColor: '#0B2B5B33',
      barPercentage: 0.3,
      type: 'bar',
      order: 2,
      data: [
        { x: 'Jan', y: [2.80, 7.50], p50: 3.90, whisker: [2.10, 9.20], pValue: 'P45' },
        { x: 'Feb', y: [3.10, 7.80], p50: 4.20, whisker: [2.40, 9.50], pValue: 'P42' },
        { x: 'Mar', y: [3.50, 8.20], p50: 4.60, whisker: [2.80, 9.90], pValue: 'P48' },
        { x: 'Apr', y: [4.20, 8.90], p50: 5.30, whisker: [3.50, 10.60], pValue: 'P52' },
        { x: 'May', y: [5.10, 9.80], p50: 6.20, whisker: [4.40, 11.50], pValue: 'P32' },
        { x: 'Jun', y: [6.30, 11.00], p50: 7.40, whisker: [5.60, 12.70], pValue: 'P40' },
        { x: 'Jul', y: [7.80, 12.50], p50: 8.90, whisker: [7.10, 14.20], pValue: 'P55' },
        { x: 'Aug', y: [8.90, 13.60], p50: 10.00, whisker: [8.20, 15.30], pValue: 'P80' },
        { x: 'Sep', y: [9.20, 13.90], p50: 10.30, whisker: [8.50, 15.60], pValue: 'P35' },
        { x: 'Oct', y: [8.50, 13.20], p50: 9.60, whisker: [7.80, 14.90], pValue: 'P45' },
        { x: 'Nov', y: [7.20, 11.90], p50: 8.30, whisker: [6.50, 13.60], pValue: 'P50' },
        { x: 'Dec', y: [5.80, 10.50], p50: 6.90, whisker: [5.10, 12.20], pValue: 'P43' }
      ],
      parsing: {
        yMin: 'y[0]',
        yMax: 'y[1]'
      }
    },
    {
      label: 'P50 Forecast',
      backgroundColor: '#0B2B5B',
      borderColor: '#0B2B5B',
      type: 'line',
      borderWidth: 2,
      pointRadius: 4,
      order: 1,
      data: [3.90, 4.20, 4.60, 5.30, 6.20, 7.40, 8.90, 10.00, 10.30, 9.60, 8.30, 6.90]
    },
    {
      label: '2024 Actuals',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 0.5)',
      type: 'line',
      borderWidth: 2,
      borderDash: [5, 5],
      pointStyle: 'circle',
      pointRadius: 6,
      order: 0,
      data: [3.30, 3.49, 5.76, 5.75, 4.44, 3.20, 6.16, 4.10, 4.74, 3.28, 3.06, 1.90]
    }
  ]
}

export const calibrationChartOptions = {
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
        label: function(context: any) {
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
} 