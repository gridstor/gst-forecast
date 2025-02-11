export function createChartOptions(yAxisLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        fill: false
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#0B2B5B',
        bodyColor: '#0B2B5B',
        borderColor: '#0B2B5B',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: $${context.raw.toFixed(2)}/${yAxisLabel}`;
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 10
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: `$/${yAxisLabel}`,
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
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
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
          autoSkip: true
        }
      }
    }
  }
} 