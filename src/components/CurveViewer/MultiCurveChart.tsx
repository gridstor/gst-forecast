import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Area } from 'recharts';

interface DataPoint {
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
}

interface MultiCurveChartProps {
  data: DataPoint[];
  selectedCurves: SelectedCurve[];
  startDate?: string | null;
  endDate?: string | null;
  commodity?: string; // Filter by commodity (e.g., "Total Revenue", "EA Revenue")
  height?: number; // Chart height in pixels
  viewMode?: 'monthly' | 'annual'; // Toggle between monthly and annual aggregation
}

interface ChartData {
  date: string;
  year: number;
  [key: string]: number | string | null;
}

const MultiCurveChart: React.FC<MultiCurveChartProps> = ({ 
  data, 
  selectedCurves,
  startDate = null, 
  endDate = null,
  commodity = 'Total Revenue',
  height = 400,
  viewMode = 'annual'
}) => {
  // Process data for multiple curves
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Filter by commodity and date range
    let filteredData = data.filter(point => point.commodity === commodity);
    
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      filteredData = filteredData.filter(point => {
        const pointDate = new Date(point.timestamp).getTime();
        return pointDate >= start && pointDate <= end;
      });
    }

    if (filteredData.length === 0) return [];

    // Group by timestamp
    const timestampGroups: { [key: string]: { [key: string]: number } } = {};
    
    filteredData.forEach(point => {
      const ts = point.timestamp;
      if (!timestampGroups[ts]) timestampGroups[ts] = {};
      
      // Find which curve this belongs to
      const curveInfo = selectedCurves.find(c => c.instanceId === point.instanceId);
      if (!curveInfo) return;
      
      if (curveInfo.isPrimary) {
        // Primary curve: Store P-values
        if (point.scenario === 'P5' || point.scenario === 'P05') timestampGroups[ts]['primaryP5'] = point.value;
        if (point.scenario === 'P25') timestampGroups[ts]['primaryP25'] = point.value;
        if (point.scenario === 'P50') timestampGroups[ts]['primaryP50'] = point.value;
        if (point.scenario === 'P75') timestampGroups[ts]['primaryP75'] = point.value;
        if (point.scenario === 'P95') timestampGroups[ts]['primaryP95'] = point.value;
      } else {
        // Overlay curves: Just store P50 or Base value
        const overlayKey = `overlay_${point.instanceId}`;
        if (point.scenario === 'P50') {
          timestampGroups[ts][overlayKey] = point.value;
        } else if (point.scenario === 'Base' || point.scenario === 'BASE') {
          timestampGroups[ts][overlayKey] = point.value;
        }
      }
    });

    // Convert to array
    const allData = Object.entries(timestampGroups).map(([timestamp, values]) => {
      const date = new Date(timestamp);
      return {
        date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        year: date.getFullYear(),
        timestamp: date,
        ...values
      };
    }).sort((a, b) => (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime());

    // Return monthly data if viewMode is 'monthly'
    if (viewMode === 'monthly') {
      return allData;
    }

    // Group by year for annual aggregation
    const yearGroups: { [key: number]: typeof allData } = {};
    allData.forEach(point => {
      if (!yearGroups[point.year]) yearGroups[point.year] = [];
      yearGroups[point.year].push(point);
    });

    const annual = Object.entries(yearGroups).map(([year, points]) => {
      const calcAvg = (key: string) => {
        const vals = points.map(p => p[key]).filter(v => typeof v === 'number') as number[];
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };

      const result: ChartData = {
        date: year,
        year: parseInt(year),
        primaryP5: calcAvg('primaryP5'),
        primaryP25: calcAvg('primaryP25'),
        primaryP50: calcAvg('primaryP50'),
        primaryP75: calcAvg('primaryP75'),
        primaryP95: calcAvg('primaryP95')
      };

      // Add overlay averages
      selectedCurves.forEach(curve => {
        if (!curve.isPrimary) {
          result[`overlay_${curve.instanceId}`] = calcAvg(`overlay_${curve.instanceId}`);
        }
      });

      return result;
    }).sort((a, b) => a.year - b.year);

    return annual;
  }, [data, selectedCurves, startDate, endDate, commodity, viewMode]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data available for {commodity}
      </div>
    );
  }

  const primaryCurve = selectedCurves.find(c => c.isPrimary);
  const overlayCurves = selectedCurves.filter(c => !c.isPrimary);

  // Custom tooltip matching Figma design system
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-gray-900 font-semibold mb-2 m-0">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mt-1">
              <span className="text-gray-600 text-sm uppercase tracking-wide">
                {entry.name}
              </span>
              <span
                className="font-bold"
                style={{ 
                  color: entry.color || entry.stroke,
                  fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace'
                }}
              >
                ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <YAxis 
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px'
            }}
            iconType="line"
          />
          
          {/* Primary Curve: P5-P95 confidence interval (cyan) */}
          {primaryCurve && (
            <>
              <Area
                type="stepAfter"
                dataKey="primaryP5"
                stroke="#34D5ED"
                fill="#34D5ED"
                fillOpacity={0.2}
                name={`${primaryCurve.instanceVersion} (P5-P95)`}
                connectNulls
              />
              <Area
                type="stepAfter"
                dataKey="primaryP95"
                stroke="#34D5ED"
                fill="#34D5ED"
                fillOpacity={0.2}
                connectNulls
              />
              
              {/* P25-P75 interquartile range (gray) */}
              <Area
                type="stepAfter"
                dataKey="primaryP25"
                stroke="#9CA3AF"
                fill="#9CA3AF"
                fillOpacity={0.3}
                name="P25-P75 Range"
                connectNulls
              />
              <Area
                type="stepAfter"
                dataKey="primaryP75"
                stroke="#9CA3AF"
                fill="#9CA3AF"
                fillOpacity={0.3}
                connectNulls
              />
              
              {/* P50 median line (blue) */}
              <Line
                type="stepAfter"
                dataKey="primaryP50"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                name={`${primaryCurve.instanceVersion} P50`}
                connectNulls
              />
            </>
          )}
          
          {/* Overlay Curves: Simple lines in assigned colors */}
          {overlayCurves.map(curve => (
            <Line
              key={curve.instanceId}
              type="stepAfter"
              dataKey={`overlay_${curve.instanceId}`}
              stroke={curve.color}
              strokeWidth={2}
              dot={false}
              name={curve.instanceVersion}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Chart Legend/Description */}
      <div className="text-xs text-gray-600 text-center">
        {primaryCurve && (
          <span className="mr-4">
            <strong className="text-blue-600">Primary ({primaryCurve.instanceVersion}):</strong> P5-P95 bands (cyan) • P25-P75 range (gray) • P50 median (blue line)
          </span>
        )}
        {overlayCurves.length > 0 && (
          <span>
            <strong>Overlays:</strong> {overlayCurves.map(c => c.instanceVersion).join(', ')} (colored lines)
          </span>
        )}
      </div>
    </div>
  );
};

export default MultiCurveChart;


