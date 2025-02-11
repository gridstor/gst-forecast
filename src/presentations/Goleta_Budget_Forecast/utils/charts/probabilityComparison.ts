// Sample data for the Goleta price forecast chart
export const goletaChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'P90',
      data: [65, 68, 70, 72, 75, 78, 80, 82, 80, 78, 75, 72],
      borderColor: '#0B2B5B',
      backgroundColor: 'rgba(11, 43, 91, 0.1)',
      fill: false,
      tension: 0.4,
      showLine: true,
      pointStyle: 'circle'
    },
    {
      label: 'P50',
      data: [70, 73, 75, 77, 80, 83, 85, 87, 85, 83, 80, 77],
      borderColor: '#34D5ED',
      backgroundColor: 'rgba(52, 213, 237, 0.1)',
      fill: false,
      tension: 0.4,
      showLine: true,
      pointStyle: 'circle'
    },
    {
      label: 'P10',
      data: [75, 78, 80, 82, 85, 88, 90, 92, 90, 88, 85, 82],
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
        text: 'Price ($/MWh)'
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