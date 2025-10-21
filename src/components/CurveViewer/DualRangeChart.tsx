import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Area, ReferenceArea } from 'recharts';

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
  scenario: string;
}

interface DualRangeChartProps {
  data: DataPoint[];
  color?: string;
}

interface ChartData {
  date: string;
  year: number;
  valueP5: number | null;
  valueP25: number | null;
  valueP50: number | null;
  valueP75: number | null;
  valueP95: number | null;
}

const DualRangeChart: React.FC<DualRangeChartProps> = ({ data, color = '#34D5ED' }) => {
  const [zoomDomain, setZoomDomain] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');

  // Process data into annual and monthly
  const { annualData, monthlyData, rawMonthlyData } = useMemo(() => {
    if (data.length === 0) return { annualData: [], monthlyData: [], rawMonthlyData: [] };

    // Group by year for annual chart
    const yearGroups: { [key: number]: DataPoint[] } = {};
    data.forEach(point => {
      const year = new Date(point.timestamp).getFullYear();
      if (!yearGroups[year]) yearGroups[year] = [];
      yearGroups[year].push(point);
    });

    const annual = Object.entries(yearGroups).map(([year, points]) => {
      const calcAvg = (key: keyof DataPoint) => {
        const vals = points.map(p => p[key]).filter(v => typeof v === 'number') as number[];
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };

      return {
        date: year,
        year: parseInt(year),
        valueP5: calcAvg('valueP5'),
        valueP25: calcAvg('valueP25'),
        valueP50: calcAvg('valueP50'),
        valueP75: calcAvg('valueP75'),
        valueP95: calcAvg('valueP95')
      };
    }).sort((a, b) => a.year - b.year);

    // Get next 7 years of monthly data
    const now = new Date();
    const sevenYearsFromNow = new Date(now.getFullYear() + 7, now.getMonth(), now.getDate());
    
    const monthly = data
      .filter(point => {
        const date = new Date(point.timestamp);
        return date >= now && date <= sevenYearsFromNow;
      })
      .map(point => ({
        date: new Date(point.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        year: new Date(point.timestamp).getFullYear(),
        valueP5: point.valueP5,
        valueP25: point.valueP25,
        valueP50: point.valueP50,
        valueP75: point.valueP75,
        valueP95: point.valueP95
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { annualData: annual, monthlyData: monthly, rawMonthlyData: data };
  }, [data]);

  // Calculate statistics for annual data
  const annualStats = useMemo(() => {
    if (annualData.length === 0) return null;

    const calcAvg = (arr: ChartData[], key: keyof ChartData) => {
      const vals = arr.map(d => d[key]).filter(v => typeof v === 'number') as number[];
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const midpoint = Math.floor(annualData.length / 2);
    const period1 = annualData.slice(0, midpoint);
    const period2 = annualData.slice(midpoint);

    return {
      period1: {
        range: `${period1[0]?.year || ''}-${period1[period1.length - 1]?.year || ''}`,
        p5: calcAvg(period1, 'valueP5'),
        p50: calcAvg(period1, 'valueP50'),
        p95: calcAvg(period1, 'valueP95')
      },
      period2: {
        range: `${period2[0]?.year || ''}-${period2[period2.length - 1]?.year || ''}`,
        p5: calcAvg(period2, 'valueP5'),
        p50: calcAvg(period2, 'valueP50'),
        p95: calcAvg(period2, 'valueP95')
      },
      lifetime: {
        p5: calcAvg(annualData, 'valueP5'),
        p50: calcAvg(annualData, 'valueP50'),
        p95: calcAvg(annualData, 'valueP95')
      }
    };
  }, [annualData]);

  // Calculate statistics for monthly data
  const monthlyStats = useMemo(() => {
    if (monthlyData.length === 0) return null;

    const calcAvg = (arr: ChartData[], key: keyof ChartData) => {
      const vals = arr.map(d => d[key]).filter(v => typeof v === 'number') as number[];
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const midpoint = Math.floor(monthlyData.length / 2);
    const period1 = monthlyData.slice(0, midpoint);
    const period2 = monthlyData.slice(midpoint);

    return {
      period1: {
        range: `${period1[0]?.date || ''} to ${period1[period1.length - 1]?.date || ''}`,
        p5: calcAvg(period1, 'valueP5'),
        p50: calcAvg(period1, 'valueP50'),
        p95: calcAvg(period1, 'valueP95')
      },
      period2: {
        range: `${period2[0]?.date || ''} to ${period2[period2.length - 1]?.date || ''}`,
        p5: calcAvg(period2, 'valueP5'),
        p50: calcAvg(period2, 'valueP50'),
        p95: calcAvg(period2, 'valueP95')
      },
      lifetime: {
        p5: calcAvg(monthlyData, 'valueP5'),
        p50: calcAvg(monthlyData, 'valueP50'),
        p95: calcAvg(monthlyData, 'valueP95')
      }
    };
  }, [monthlyData]);

  // Zoom functionality
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    setZoomDomain({ left: refAreaLeft, right: refAreaRight });
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const zoomOut = () => {
    setZoomDomain({ left: null, right: null });
  };

  // Download functionality
  const handleDownload = () => {
    const csvRows = [
      ['Type', 'Date', 'P5', 'P25', 'P50', 'P75', 'P95'],
      ...annualData.map(d => [
        'Annual',
        d.date,
        d.valueP5?.toFixed(2) || '',
        d.valueP25?.toFixed(2) || '',
        d.valueP50?.toFixed(2) || '',
        d.valueP75?.toFixed(2) || '',
        d.valueP95?.toFixed(2) || ''
      ]),
      ...monthlyData.map(d => [
        'Monthly',
        d.date,
        d.valueP5?.toFixed(2) || '',
        d.valueP25?.toFixed(2) || '',
        d.valueP50?.toFixed(2) || '',
        d.valueP75?.toFixed(2) || '',
        d.valueP95?.toFixed(2) || ''
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `curve_forecast_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-[#E5E7EB] rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-[#1F2937] mb-2">{data.date}</p>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280]">P95:</span>
              <span className="font-semibold text-[#111827]">${data.valueP95?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280]">P75:</span>
              <span className="text-[#111827]">${data.valueP75?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#3B82F6] font-medium">P50:</span>
              <span className="font-bold text-[#3B82F6]">${data.valueP50?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280]">P25:</span>
              <span className="text-[#111827]">${data.valueP25?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280]">P5:</span>
              <span className="font-semibold text-[#111827]">${data.valueP5?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = (chartData: ChartData[], title: string, isMonthly: boolean = false, stats: any = null) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-[#1F2937]">{title}</h3>
        {!isMonthly && (
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm bg-[#10B981] text-white rounded-md hover:bg-[#059669] transition-colors"
            >
              Download Data
            </button>
            {zoomDomain.left && (
              <button
                onClick={zoomOut}
                className="px-3 py-1 text-sm bg-[#6B7280] text-white rounded-md hover:bg-[#4B5563] transition-colors"
              >
                Reset Zoom
              </button>
            )}
          </div>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={isMonthly ? 400 : 350} style={{ backgroundColor: 'white' }}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 60, bottom: isMonthly ? 60 : 40 }}
          onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
          onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
          onMouseUp={zoom}
        >
          <defs>
            <linearGradient id={`p25p75Fill-${isMonthly}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id={`p5p95Fill-${isMonthly}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            angle={isMonthly ? -45 : 0}
            textAnchor={isMonthly ? "end" : "middle"}
            height={isMonthly ? 80 : 40}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            domain={zoomDomain.left ? [zoomDomain.left, zoomDomain.right] : ['auto', 'auto']}
          />
          <YAxis 
            tick={{ fill: '#6B7280', fontSize: 11 }}
            domain={[0, 'auto']}
            label={{ 
              value: isMonthly ? 'Monthly ($/kW-month)' : 'Annual Average ($/kW-month)', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10,
              style: { fill: '#374151', fontSize: 11, fontWeight: 500, textAnchor: 'middle' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={24}
            wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
          />
          
          {/* P5-P95 outer range */}
          <Area
            type="step"
            dataKey="valueP95"
            stroke="none"
            fill={`url(#p5p95Fill-${isMonthly})`}
            name="P5-P95"
          />
          <Area
            type="step"
            dataKey="valueP5"
            stroke="none"
            fill="white"
            name=""
          />
          
          {/* P25-P75 inner range */}
          <Area
            type="step"
            dataKey="valueP75"
            stroke="none"
            fill={`url(#p25p75Fill-${isMonthly})`}
            name="P25-P75"
          />
          <Area
            type="step"
            dataKey="valueP25"
            stroke="none"
            fill="white"
            name=""
          />
          
          {/* P50 median line - NO DOTS */}
          <Line 
            type="step"
            dataKey="valueP50" 
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            name="P50"
          />
          
          {refAreaLeft && refAreaRight && (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
              fill="#8884d8"
              fillOpacity={0.3}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Statistics Table */}
      {stats && (
        <div className="mt-3 bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          <table className="min-w-full divide-y divide-[#E5E7EB]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Period
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  P5
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  P50
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  P95
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-4 py-2 text-sm text-[#6B7280] font-medium">{stats.period1.range}</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono">${stats.period1.p5.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono">${stats.period1.p50.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono">${stats.period1.p95.toFixed(2)}</td>
              </tr>
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-4 py-2 text-sm text-[#6B7280] font-medium">{stats.period2.range}</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono">${stats.period2.p5.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono">${stats.period2.p50.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono">${stats.period2.p95.toFixed(2)}</td>
              </tr>
              <tr className="bg-[#F9FAFB] hover:bg-[#F3F4F6]">
                <td className="px-4 py-2 text-sm text-[#111827] font-semibold">Lifetime Average</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono font-semibold">${stats.lifetime.p5.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono font-semibold">${stats.lifetime.p50.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm text-[#111827] text-right font-mono font-semibold">${stats.lifetime.p95.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (annualData.length === 0) {
    return (
      <div className="text-center py-8 text-[#6B7280]">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Annual Chart */}
      {renderChart(annualData, 'Annual Revenue Projection', false, annualStats)}
      
      {/* Monthly Chart - Next 7 Years */}
      {monthlyData.length > 0 && renderChart(monthlyData, 'Monthly Detail - Next 7 Years', true, monthlyStats)}
      
      {monthlyData.length === 0 && (
        <div className="text-center py-4 text-sm text-[#6B7280] bg-[#F9FAFB] rounded-lg">
          No monthly data available for the next 7 years
        </div>
      )}
    </div>
  );
};

export default DualRangeChart;

