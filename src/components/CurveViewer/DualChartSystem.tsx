import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CurveData, Granularity } from '../../lib/types';

// GridStor Design System Colors
const COLORS = {
  primary: '#3B82F6',    // Blue - Primary data
  secondary: '#10B981',  // Green - Success metrics
  tertiary: '#EF4444',   // Red - Critical metrics
  accent: '#8B5CF6',     // Purple - Special categories
  dark: '#F59E0B',       // Amber - Warnings
  gray: '#E5E7EB'        // Light gray for grid lines
};

interface DualChartSystemProps {
  data: (CurveData & { style?: { color: string; lineStyle: 'solid' | 'dashed' | 'dotted' } })[];
  granularity: Granularity;
  height?: number;
}

interface ExtendedCurveData extends Omit<CurveData, 'date'> {
  date: number;
}

const formatMarkDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });
};

const getStrokeDasharray = (lineStyle: 'solid' | 'dashed' | 'dotted') => {
  switch (lineStyle) {
    case 'dashed':
      return '5 5';
    case 'dotted':
      return '1 5';
    default:
      return '0';
  }
};

// Define proper types for the tooltip props
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: number;
}

export const DualChartSystem: React.FC<DualChartSystemProps> = ({ 
  data, 
  granularity,
  height = 400
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get unique curves from data
  const uniqueCurves = React.useMemo(() => {
    const seen = new Set<number>();
    return data.filter(curve => {
      if (seen.has(curve.curveId)) return false;
      seen.add(curve.curveId);
      return true;
    });
  }, [data]);

  // Group data by curve ID and sort dates
  const groupedData = React.useMemo(() => {
    const result = data.reduce((acc, point) => {
      if (!acc[point.curveId]) {
        acc[point.curveId] = [];
      }
      acc[point.curveId].push({
        ...point,
        date: new Date(point.date).getTime() // Convert to timestamp for proper sorting
      });
      return acc;
    }, {} as Record<number, ExtendedCurveData[]>);

    // Sort each curve's data by date
    Object.values(result).forEach(points => {
      points.sort((a, b) => a.date - b.date);
    });

    return result;
  }, [data]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return granularity === 'monthly' 
      ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : date.getFullYear().toString();
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-gray-900 font-semibold mb-2 m-0">{label ? formatDate(label) : ''}</p>
          {payload.map((entry, index) => (
            <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-4 mt-1">
              <span className="text-gray-600 text-sm uppercase tracking-wide">
                {entry.name}
              </span>
              <span className="font-mono font-bold" style={{ color: entry.color }}>
                ${entry.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!mounted) {
    return <div style={{ width: '100%', height: `${height}px` }} />;
  }

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <ResponsiveContainer>
        <LineChart margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray} />
          <XAxis 
            dataKey="date"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDate}
            stroke="#6B7280"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px'
            }}
          />
          <YAxis 
            label={{ 
              value: '$/kw-mn', 
              angle: -90, 
              position: 'insideLeft',
              offset: 0,
              style: {
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                fill: '#6B7280'
              }
            }}
            stroke="#6B7280"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px'
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{
              paddingTop: '20px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px'
            }}
          />
          {Object.entries(groupedData).map(([curveId, curveData], index) => {
            const curve = uniqueCurves.find(d => d.curveId === Number(curveId));
            const label = curve ? 
              `${curve.curve_creator} - ${curve.mark_case} (${formatDate(new Date(curve.mark_date).getTime())})` :
              `Curve ${curveId}`;
            const style = curve?.style || {
              color: Object.values(COLORS)[index % Object.keys(COLORS).length],
              lineStyle: 'solid' as const
            };
            
            return (
              <Line 
                key={curveId}
                type="monotone" 
                data={curveData}
                dataKey="value" 
                name={label}
                stroke={style.color}
                strokeWidth={2}
                strokeDasharray={getStrokeDasharray(style.lineStyle)}
                dot={{ fill: style.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 