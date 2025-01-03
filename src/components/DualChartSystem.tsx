import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CurveData, Granularity } from '../lib/types';

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
  data: CurveData[];
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

export const DualChartSystem: React.FC<DualChartSystemProps> = ({ 
  data, 
  title,
  granularity,
  height = 400
}) => {
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

  // Calculate average value for each curve
  const averages = Object.entries(groupedData).reduce((acc, [curveId, points]) => {
    const sum = points.reduce((total, point) => total + point.value, 0);
    acc[curveId] = sum / points.length;
    return acc;
  }, {} as Record<string, number>);

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

  // Get unique values for dropdowns
  const uniqueValues = React.useMemo(() => {
    return uniqueCurves.reduce((acc, curve) => {
      if (!acc.mark_cases.includes(curve.mark_case)) acc.mark_cases.push(curve.mark_case);
      if (!acc.locations.includes(curve.location)) acc.locations.push(curve.location);
      if (!acc.curve_creators.includes(curve.curve_creator)) acc.curve_creators.push(curve.curve_creator);
      if (!acc.mark_dates.includes(curve.mark_date)) acc.mark_dates.push(curve.mark_date);
      return acc;
    }, {
      mark_cases: [] as string[],
      locations: [] as string[],
      curve_creators: [] as string[],
      mark_dates: [] as string[]
    });
  }, [uniqueCurves]);

  return (
    <div>
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
                `${curve.location} - ${curve.mark_type} - ${curve.mark_case} (${curve.curve_creator})` :
                `Curve ${curveId}`;
              
              return (
                <Line 
                  key={curveId}
                  type="monotone" 
                  data={curveData}
                  dataKey="value" 
                  name={label}
                  stroke={Object.values(COLORS)[index % Object.keys(COLORS).length]}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {Object.entries(averages).map(([curveId, average]) => {
          const curve = uniqueCurves.find(d => d.curveId === Number(curveId));
          const label = curve ? 
            `${curve.curve_creator}, ${curve.location}, ${curve.mark_case}, ${formatMarkDate(curve.mark_date)}` :
            `Curve ${curveId}`;

          return (
            <div key={curveId} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-600">{label}</h3>
              <p className="text-2xl font-bold mt-2">
                ${average.toLocaleString('en-US', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
              <p className="text-xs text-gray-500">Average $/kw-mn</p>
            </div>
          );
        })}
      </div>
      {showNewRow && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          <select
            value={filters.mark_case}
            onChange={(e) => setFilters(prev => ({ ...prev, mark_case: e.target.value }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Case</option>
            {uniqueValues.mark_cases.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select
            value={filters.mark_date}
            onChange={(e) => setFilters(prev => ({ ...prev, mark_date: e.target.value }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Date</option>
            {uniqueValues.mark_dates.map(value => (
              <option key={value} value={value}>{formatMarkDate(value)}</option>
            ))}
          </select>
          <select
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Location</option>
            {uniqueValues.locations.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select
            value={filters.curve_creator}
            onChange={(e) => setFilters(prev => ({ ...prev, curve_creator: e.target.value }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Creator</option>
            {uniqueValues.curve_creators.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      )}
      {!showNewRow && (
        <button
          onClick={() => setShowNewRow(true)}
          className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Curve
        </button>
      )}
    </div>
  );
}; 