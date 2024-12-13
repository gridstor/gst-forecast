import type { ChartDataset, SliderOptions } from '../types/chart';
import { Chart } from 'chart.js';
import 'chart.js/auto';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';
import type { API as NoUiSliderAPI } from 'nouislider';

export function createChart(canvas: HTMLCanvasElement, datasets: ChartDataset[]) {
  console.log('Creating chart with datasets:', datasets);
  
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;

  return new Chart(canvas, {
    type: 'line',
    data: {
      datasets
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'year'
          }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

export function setupSlider(slider: HTMLElement & { noUiSlider?: NoUiSliderAPI }, { minYear, maxYear, chart, startDateEl, endDateEl, years, datasets }: SliderOptions) {
  const numericYears = years.map(Number);
  
  noUiSlider.create(slider, {
    start: [Number(minYear), Number(maxYear)],
    connect: true,
    range: {
      'min': Number(minYear),
      'max': Number(maxYear)
    },
    step: 1,
    tooltips: true,
    format: {
      to: (value) => Math.round(Number(value)),
      from: (value) => Math.round(Number(value))
    }
  });

  function updateStats(start: number, end: number) {
    const startIdx = numericYears.indexOf(start);
    const endIdx = numericYears.indexOf(end);
    
    datasets.forEach(dataset => {
      const values = dataset.data.slice(startIdx, endIdx + 1).map(d => Number(d.value));
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const statEl = document.getElementById(`stat-${dataset.label}`);
      if (statEl) {
        statEl.textContent = `$${average.toLocaleString('en-US', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })}`;
      }
    });
  }

  slider.noUiSlider?.on('update', (values) => {
    const [start, end] = values.map(Number);
    
    if (startDateEl) startDateEl.textContent = start.toString();
    if (endDateEl) endDateEl.textContent = end.toString();
    
    const startDate = new Date(start, 0, 1);
    const endDate = new Date(end, 11, 31);
    
    (chart.options.scales!.x as any).min = startDate;
    (chart.options.scales!.x as any).max = endDate;
    chart.update();
    
    updateStats(start, end);
  });

  // Initialize stats
  updateStats(minYear, maxYear);
}

export function downloadData(chartId: string, filename: string) {
  const canvas = document.getElementById(chartId);
  const datasets = JSON.parse(canvas?.dataset?.datasets || '[]');
  const csvRows = [['Date', ...datasets.map((d: { label: string }) => d.label)]];
  
  const dataByDate: { [key: string]: { date: string, [key: string]: any } } = {};
  datasets.forEach((dataset: { label: string, data: Array<{ date: string, value: number }> }) => {
    dataset.data.forEach(point => {
      if (!dataByDate[point.date]) {
        dataByDate[point.date] = { date: point.date };
      }
      dataByDate[point.date][dataset.label] = point.value;
    });
  });

  Object.values(dataByDate).forEach((row: any) => {
    csvRows.push([
      new Date(row.date).getFullYear(),
      ...datasets.map((d: { label: string }) => row[d.label] || '')
    ]);
  });

  const csvContent = csvRows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
} 