import { Chart } from 'chart.js';

export interface ChartDataset {
  label: string;
  data: Array<{ date: string; value: number }>;
  borderColor: string;
  tension: number;
  borderWidth: number;
  hidden?: boolean;
}

export interface SliderOptions {
  minYear: number;
  maxYear: number;
  chart: Chart;
  startDateEl: HTMLElement | null;
  endDateEl: HTMLElement | null;
  years: number[];
  datasets: ChartDataset[];
} 