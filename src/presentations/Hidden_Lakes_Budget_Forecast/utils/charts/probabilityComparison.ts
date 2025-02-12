// Sample data for the Hidden Lakes price forecast chart
export const houstonChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'P90',
      data: [2.80, 3.10, 3.50, 4.20, 5.10, 6.30, 7.80, 8.90, 9.20, 8.50, 7.20, 5.80],
      borderColor: '#0B2B5B',
      backgroundColor: 'rgba(11, 43, 91, 0.1)',
      fill: false,
      tension: 0.4,
      showLine: true,
      pointStyle: 'circle'
    },
    {
      label: 'P50',
      data: [3.90, 4.20, 4.60, 5.30, 6.20, 7.40, 8.90, 10.00, 10.30, 9.60, 8.30, 6.90],
      borderColor: '#34D5ED',
      backgroundColor: 'rgba(52, 213, 237, 0.1)',
      fill: false,
      tension: 0.4,
      showLine: true,
      pointStyle: 'circle'
    },
    {
      label: 'P10',
      data: [7.50, 7.80, 8.20, 8.90, 9.80, 11.00, 12.50, 13.60, 13.90, 13.20, 11.90, 10.50],
      borderColor: '#FF6B6B',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      fill: false,
      tension: 0.4,
      showLine: true,
      pointStyle: 'circle'
    }
  ]
}

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'Price ($/kw-mn)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Month'
      }
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        boxWidth: 12,
        padding: 8,
        font: { size: 10 }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false
    },
    datalabels: false,
    labels: false
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
} 