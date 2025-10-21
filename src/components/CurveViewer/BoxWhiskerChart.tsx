import React from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Area } from 'recharts';

interface DataPoint {
  timestamp: string;
  valueP5: number | null;
  valueP25: number | null;
  valueP50: number | null;
  valueP75: number | null;
  valueP95: number | null;
  instanceId: number;
  curveName: string;
  units: string;
}

interface BoxWhiskerChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

const BoxWhiskerChart: React.FC<BoxWhiskerChartProps> = ({ data, height = 400, color = '#34D5ED' }) => {
  // Group data by timestamp
  const groupedData = React.useMemo(() => {
    const groups: { [key: string]: DataPoint[] } = {};
    
    data.forEach(point => {
      const dateKey = new Date(point.timestamp).toLocaleDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(point);
    });
    
    // Convert to chart format - for now, just use the first curve's data per timestamp
    return Object.entries(groups).map(([dateKey, points]) => {
      const point = points[0]; // For simplicity, taking first point
      return {
        date: dateKey,
        valueP5: point.valueP5,
        valueP25: point.valueP25,
        valueP50: point.valueP50,
        valueP75: point.valueP75,
        valueP95: point.valueP95,
        curveName: point.curveName
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-[#E5E7EB] rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-[#1F2937] mb-1">{data.date}</p>
          <p className="text-xs text-[#6B7280] mb-2">{data.curveName}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280]">P95:</span>
              <span className="font-mono font-semibold text-[#111827]">
                ${data.valueP95?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280]">P75:</span>
              <span className="font-mono text-[#111827]">
                ${data.valueP75?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#3B82F6] font-medium">P50 (Median):</span>
              <span className="font-mono font-bold text-[#3B82F6]">
                ${data.valueP50?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280]">P25:</span>
              <span className="font-mono text-[#111827]">
                ${data.valueP25?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280]">P5:</span>
              <span className="font-mono font-semibold text-[#111827]">
                ${data.valueP5?.toFixed(2) || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics for the period
  const stats = React.useMemo(() => {
    if (groupedData.length === 0) return null;
    
    const midpoint = Math.floor(groupedData.length / 2);
    const period1 = groupedData.slice(0, midpoint);
    const period2 = groupedData.slice(midpoint);
    
    const calcAvg = (arr: any[], key: string) => {
      const vals = arr.map(d => d[key]).filter(v => v != null);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    
    return {
      period1: {
        p5: calcAvg(period1, 'valueP5'),
        p50: calcAvg(period1, 'valueP50'),
        p95: calcAvg(period1, 'valueP95'),
        range: `${period1[0]?.date || ''} - ${period1[period1.length - 1]?.date || ''}`
      },
      period2: {
        p5: calcAvg(period2, 'valueP5'),
        p50: calcAvg(period2, 'valueP50'),
        p95: calcAvg(period2, 'valueP95'),
        range: `${period2[0]?.date || ''} - ${period2[period2.length - 1]?.date || ''}`
      },
      lifetime: {
        p5: calcAvg(groupedData, 'valueP5'),
        p50: calcAvg(groupedData, 'valueP50'),
        p95: calcAvg(groupedData, 'valueP95')
      }
    };
  }, [groupedData]);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={groupedData}
          margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
        >
          <defs>
            {/* Gradient for P25-P75 range */}
            <linearGradient id="p25p75Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.3}/>
            </linearGradient>
            {/* Gradient for P5-P95 range */}
            <linearGradient id="p5p95Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: '#6B7280', fontSize: 11 }}
          />
          <YAxis 
            tick={{ fill: '#6B7280', fontSize: 11 }}
            domain={[0, 'auto']}
            label={{ 
              value: 'Annual Average ($/kW-month)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: '#374151', fontSize: 12, fontWeight: 500 }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          
          {/* P5-P95 outer range (cyan/custom color) */}
          <Area
            type="monotone"
            dataKey="valueP95"
            stroke="none"
            fill="url(#p5p95Fill)"
            name="P5-P95 Range"
          />
          <Area
            type="monotone"
            dataKey="valueP5"
            stroke="none"
            fill="white"
            name=""
          />
          
          {/* P25-P75 inner range (gray) */}
          <Area
            type="monotone"
            dataKey="valueP75"
            stroke="none"
            fill="url(#p25p75Fill)"
            name="P25-P75 Range"
          />
          <Area
            type="monotone"
            dataKey="valueP25"
            stroke="none"
            fill="white"
            name=""
          />
          
          {/* P50 median line */}
          <Line 
            type="monotone" 
            dataKey="valueP50" 
            stroke={color}
            strokeWidth={2.5}
            dot={{ fill: color, r: 4 }}
            name="P50 (Median)"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Statistics Box */}
      {stats && (
        <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-md border border-[#E5E7EB] text-xs z-10">
          <div className="space-y-1.5 font-mono">
            <div className="font-semibold text-[#374151] mb-2">Period Statistics</div>
            <div>
              <span className="text-[#6B7280]">{stats.period1.range}:</span>
              <div className="ml-2">
                P5: ${stats.period1.p5.toFixed(2)} | P50: ${stats.period1.p50.toFixed(2)} | P95: ${stats.period1.p95.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-[#6B7280]">{stats.period2.range}:</span>
              <div className="ml-2">
                P5: ${stats.period2.p5.toFixed(2)} | P50: ${stats.period2.p50.toFixed(2)} | P95: ${stats.period2.p95.toFixed(2)}
              </div>
            </div>
            <div className="pt-1 border-t border-[#E5E7EB]">
              <span className="text-[#6B7280] font-semibold">Lifetime:</span>
              <div className="ml-2">
                P5: ${stats.lifetime.p5.toFixed(2)} | P50: ${stats.lifetime.p50.toFixed(2)} | P95: ${stats.lifetime.p95.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoxWhiskerChart;

