/**
 * TEMPLATE: Area Chart Example
 * 
 * Professional area chart with GridStor design system styling.
 * Shows cumulative or continuous data with filled areas.
 * 
 * Usage:
 * - Copy this component
 * - Replace the data array with your data
 * - Customize colors, title, and axis labels as needed
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from '../ChartCard';
import { SectionHeader } from '../SectionHeader';

// Sample data - replace with your own
const revenueData = [
  { quarter: 'Q1 2024', energy: 28.5, capacity: 42.3, ancillary: 12.8 },
  { quarter: 'Q2 2024', energy: 32.1, capacity: 45.7, ancillary: 14.2 },
  { quarter: 'Q3 2024', energy: 35.8, capacity: 48.2, ancillary: 15.6 },
  { quarter: 'Q4 2024', energy: 38.4, capacity: 51.5, ancillary: 16.8 },
  { quarter: 'Q1 2025', energy: 42.5, capacity: 55.3, ancillary: 18.7 },
  { quarter: 'Q2 2025', energy: 45.2, capacity: 58.1, ancillary: 19.5 },
];

// Custom tooltip with GridStor styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="text-gray-900 font-semibold mb-2 m-0">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mt-1">
            <span className="text-gray-600 text-sm uppercase tracking-wide">
              {entry.name}
            </span>
            <span
              className="font-mono font-bold"
              style={{ color: entry.color }}
            >
              ${entry.value}M
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-gray-200">
          <span className="text-gray-900 text-sm uppercase tracking-wide font-semibold">
            Total
          </span>
          <span className="font-mono font-bold text-gray-900">
            ${total.toFixed(1)}M
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function AreaChartExample() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Revenue Breakdown"
          description="Quarterly revenue streams showing cumulative growth"
        />

        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            title="Revenue by Stream"
            accentColor="green"
            timestamp="Oct 17, 2025 3:00 PM"
            description="Stacked area chart showing energy arbitrage, capacity revenue, and ancillary services ($M)"
          >
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorAncillary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="quarter"
                  stroke="#6B7280"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                  }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                  }}
                  label={{
                    value: 'Revenue ($M)',
                    angle: -90,
                    position: 'insideLeft',
                    style: {
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      fill: '#6B7280',
                    },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  name="Energy Arbitrage"
                  stackId="1"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEnergy)"
                />
                <Area
                  type="monotone"
                  dataKey="capacity"
                  name="Capacity Revenue"
                  stackId="1"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCapacity)"
                />
                <Area
                  type="monotone"
                  dataKey="ancillary"
                  name="Ancillary Services"
                  stackId="1"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAncillary)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
