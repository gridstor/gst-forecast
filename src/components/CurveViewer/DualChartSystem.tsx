import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CurveData, Granularity } from '../../lib/types';

// Define brand colors
const COLORS = {
  primary: '#2AB3CB',    // Bright turquoise
  secondary: '#1D7874',  // Teal green
  tertiary: '#679289',   // Sage green
  accent: '#F4C095',     // Peach
  dark: '#E2231A',       // Red
  gray: '#E5E7EB'        // Light gray for grid lines
};

interface DualChartSystemProps {
  data: (CurveData & { style?: { color: string; lineStyle: 'solid' | 'dashed' | 'dotted' } })[];
  title: string;
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

export const DualChartSystem: React.FC<DualChartSystemProps> = ({ 
  data, 
  title,
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

  const [showNewRow, setShowNewRow] = useState(false);
  const [filters, setFilters] = useState({
    mark_case: '',
    mark_date: '',
    location: '',
    curve_creator: ''
  });

  // Group data by curve ID and sort dates
  const groupedData = data.reduce((acc, point) => {
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
  Object.values(groupedData).forEach(points => {
    points.sort((a, b) => a.date - b.date);
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return granularity === 'monthly' 
      ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : date.getFullYear().toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
          <p className="text-sm font-medium text-gray-900">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`${entry.name}-${index}`} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: $${entry.value.toFixed(2)}/kw-mn`}
            </p>
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
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ 
              value: '$/kw-mn', 
              angle: -90, 
              position: 'insideLeft',
              offset: 0,
              fontSize: 14,
              fontWeight: 500
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px'
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
                dot={false}
                activeDot={{ r: 6 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 