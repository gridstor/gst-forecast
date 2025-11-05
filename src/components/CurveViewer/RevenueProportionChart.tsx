import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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

interface SelectedCurveInfo {
  instanceId: number;
  curveName: string;
  instanceVersion: string;
  color: string;
  isPrimary: boolean;
  createdAt?: string;
  createdBy?: string;
}

interface RevenueProportionChartProps {
  data: CurveDataPoint[];
  selectedCurves: SelectedCurveInfo[];
  startDate: string | null;
  endDate: string | null;
  selectedScenario: string;
  groupBy: 'year' | 'month' | 'quarter';
}

interface AggregatedData {
  period: string;
  energyRevenue: number;
  asRevenue: number;
  totalRevenue: number;
  energyPercent: number;
  asPercent: number;
}

interface SummaryStats {
  energyAvg: number;
  asAvg: number;
  totalAvg: number;
  energyPercentAvg: number;
  asPercentAvg: number;
}

export default function RevenueProportionChart({
  data,
  selectedCurves,
  startDate,
  endDate,
  selectedScenario,
  groupBy
}: RevenueProportionChartProps) {
  
  const { aggregatedData, summaryStats } = useMemo(() => {
    // Get primary curve data
    const primaryCurve = selectedCurves.find(c => c.isPrimary);
    if (!primaryCurve || data.length === 0) {
      return { aggregatedData: [], summaryStats: null };
    }

    // Filter data for selected scenario and date range
    let filteredData = data.filter(
      point => 
        point.instanceId === primaryCurve.instanceId &&
        point.scenario === selectedScenario &&
        (point.commodity === 'EA Revenue' || point.commodity === 'AS Revenue')
    );

    // Apply date filter
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      filteredData = filteredData.filter(point => {
        const pointDate = new Date(point.timestamp).getTime();
        return pointDate >= start && pointDate <= end;
      });
    }

    if (filteredData.length === 0) {
      return { aggregatedData: [], summaryStats: null };
    }

    // Group data by period
    const grouped = new Map<string, { energy: number[]; as: number[] }>();
    
    filteredData.forEach(point => {
      const date = new Date(point.timestamp);
      let periodKey: string;
      
      switch (groupBy) {
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()} Q${quarter}`;
          break;
        case 'month':
          periodKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          break;
        default:
          periodKey = date.getFullYear().toString();
      }
      
      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, { energy: [], as: [] });
      }
      
      const group = grouped.get(periodKey)!;
      if (point.commodity === 'EA Revenue') {
        group.energy.push(point.value);
      } else if (point.commodity === 'AS Revenue') {
        group.as.push(point.value);
      }
    });

    // Calculate averages for each period
    const aggregated: AggregatedData[] = [];
    grouped.forEach((values, period) => {
      const energyAvg = values.energy.length > 0 
        ? values.energy.reduce((a, b) => a + b, 0) / values.energy.length 
        : 0;
      const asAvg = values.as.length > 0 
        ? values.as.reduce((a, b) => a + b, 0) / values.as.length 
        : 0;
      const total = energyAvg + asAvg;
      
      aggregated.push({
        period,
        energyRevenue: energyAvg,
        asRevenue: asAvg,
        totalRevenue: total,
        energyPercent: total > 0 ? (energyAvg / total) * 100 : 0,
        asPercent: total > 0 ? (asAvg / total) * 100 : 0
      });
    });

    // Sort by period
    aggregated.sort((a, b) => {
      // Parse period strings for sorting
      if (groupBy === 'year') {
        return parseInt(a.period) - parseInt(b.period);
      } else if (groupBy === 'quarter') {
        const [aYear, aQ] = a.period.split(' Q');
        const [bYear, bQ] = b.period.split(' Q');
        const aVal = parseInt(aYear) * 10 + parseInt(aQ);
        const bVal = parseInt(bYear) * 10 + parseInt(bQ);
        return aVal - bVal;
      } else {
        return new Date(a.period).getTime() - new Date(b.period).getTime();
      }
    });

    // Calculate summary stats
    const totalEnergy = aggregated.reduce((sum, d) => sum + d.energyRevenue, 0);
    const totalAS = aggregated.reduce((sum, d) => sum + d.asRevenue, 0);
    const grandTotal = totalEnergy + totalAS;
    
    const summary: SummaryStats = {
      energyAvg: aggregated.length > 0 ? totalEnergy / aggregated.length : 0,
      asAvg: aggregated.length > 0 ? totalAS / aggregated.length : 0,
      totalAvg: aggregated.length > 0 ? grandTotal / aggregated.length : 0,
      energyPercentAvg: grandTotal > 0 ? (totalEnergy / grandTotal) * 100 : 0,
      asPercentAvg: grandTotal > 0 ? (totalAS / grandTotal) * 100 : 0
    };

    return { aggregatedData: aggregated, summaryStats: summary };
  }, [data, selectedCurves, startDate, endDate, selectedScenario, groupBy]);

  // GridStor Design System Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const energy = payload.find((p: any) => p.dataKey === 'energyRevenue')?.value || 0;
    const as = payload.find((p: any) => p.dataKey === 'asRevenue')?.value || 0;
    const total = energy + as;
    const energyPercent = total > 0 ? (energy / total) * 100 : 0;
    const asPercent = total > 0 ? (as / total) * 100 : 0;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="text-gray-900 font-semibold mb-2 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>
          {label}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4 mt-1">
            <span className="text-gray-600 text-sm uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
              Energy Arb.
            </span>
            <span className="font-mono font-bold text-gray-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ${energy.toLocaleString()} ({energyPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 mt-1">
            <span className="text-gray-600 text-sm uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
              Ancillary Svcs
            </span>
            <span className="font-mono font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#8B5CF6' }}>
              ${as.toLocaleString()} ({asPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200 mt-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-900 font-semibold uppercase text-xs tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                Total
              </span>
              <span className="font-mono font-bold text-gray-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                ${total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!summaryStats || aggregatedData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for the selected period and scenario.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Stacked Bar Chart - GridStor Design System */}
      <div className="lg:col-span-3">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={aggregatedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="period" 
              stroke="#6B7280"
              tick={{ fontSize: 12, fill: '#6B7280', fontFamily: 'Inter, sans-serif' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fontSize: 12, fill: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}
              label={{ 
                value: 'Revenue ($)', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fontSize: 12, fill: '#6B7280', fontFamily: 'Inter, sans-serif' } 
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top"
              height={36}
              iconType="square"
              wrapperStyle={{ 
                fontSize: '14px', 
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif'
              }}
            />
            <Bar 
              dataKey="energyRevenue" 
              stackId="a" 
              fill="#10B981" 
              name="Energy Arbitrage"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="asRevenue" 
              stackId="a" 
              fill="#8B5CF6" 
              name="Ancillary Services"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards - GridStor Design System */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
          Average Revenue
        </h3>
        
        {/* Energy Arbitrage Card */}
        <div 
          className="bg-white rounded-lg p-4 transition-shadow duration-300 hover:shadow-md"
          style={{ 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #10B981'
          }}
        >
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Energy Arbitrage
          </div>
          <div 
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            ${summaryStats.energyAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="bg-green-50 rounded p-2 mb-2">
            <div className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {summaryStats.energyPercentAvg.toFixed(1)}% of total revenue
            </div>
          </div>
          {/* Progress bar */}
          <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${summaryStats.energyPercentAvg}%`,
                backgroundColor: '#10B981'
              }}
            ></div>
          </div>
        </div>

        {/* Ancillary Services Card */}
        <div 
          className="bg-white rounded-lg p-4 transition-shadow duration-300 hover:shadow-md"
          style={{ 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #8B5CF6'
          }}
        >
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Ancillary Services
          </div>
          <div 
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            ${summaryStats.asAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="bg-purple-50 rounded p-2 mb-2">
            <div className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {summaryStats.asPercentAvg.toFixed(1)}% of total revenue
            </div>
          </div>
          {/* Progress bar */}
          <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${summaryStats.asPercentAvg}%`,
                backgroundColor: '#8B5CF6'
              }}
            ></div>
          </div>
        </div>

        {/* Total Card */}
        <div 
          className="bg-white rounded-lg p-4 transition-shadow duration-300 hover:shadow-md"
          style={{ 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #3B82F6'
          }}
        >
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Total Average
          </div>
          <div 
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            ${summaryStats.totalAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            per {groupBy === 'year' ? 'year' : groupBy === 'quarter' ? 'quarter' : 'month'}
          </div>
        </div>
      </div>
    </div>
  );
}

