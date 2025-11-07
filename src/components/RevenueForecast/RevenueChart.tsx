import React from 'react';
import InteractiveMultiCurveChart from '../CurveViewer/InteractiveMultiCurveChart';

interface CurveDataPoint {
  timestamp: string;
  value: number;
  curveType: string;
  commodity: string;
  scenario: string;
  instanceId: number;
  curveName: string;
  units: string;
}

interface SelectedCurve {
  instanceId: number;
  curveName: string;
  instanceVersion: string;
  color: string;
  isPrimary: boolean;
  createdAt?: string;
  createdBy?: string;
}

interface RevenueChartProps {
  data: CurveDataPoint[];
  selectedCurves: SelectedCurve[];
  startDate?: string | null;
  endDate?: string | null;
  viewMode?: 'monthly' | 'annual';
  height?: number;
}

export function RevenueChart({
  data,
  selectedCurves,
  startDate = null,
  endDate = null,
  viewMode = 'annual',
  height = 400
}: RevenueChartProps) {
  return (
    <div className="bg-white dark:bg-[#2A2A2A] rounded-lg shadow-sm p-4">
      <InteractiveMultiCurveChart
        data={data}
        selectedCurves={selectedCurves}
        startDate={startDate}
        endDate={endDate}
        commodity="Total Revenue"
        height={height}
        viewMode={viewMode}
      />
    </div>
  );
}

