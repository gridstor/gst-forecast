export interface ChartDataset {
  label: string;
  data: Array<{ date: string; value: number }>;
  borderColor: string;
  tension: number;
} 