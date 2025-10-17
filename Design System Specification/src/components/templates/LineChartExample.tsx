/**
 * TEMPLATE: Line Chart Example
 * 
 * Professional line chart with GridStor design system styling.
 * Shows time-series data with clean, readable formatting.
 * 
 * Usage:
 * - Copy this component
 * - Replace the data array with your data
 * - Customize colors, title, and axis labels as needed
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from '../ChartCard';
import { SectionHeader } from '../SectionHeader';

// Sample data - replace with your own
const priceData = [
  { month: 'Jan', caiso: 7.2, ercot: 11.5, spp: 5.8 },
  { month: 'Feb', caiso: 7.5, ercot: 12.1, spp: 6.0 },
  { month: 'Mar', caiso: 7.1, ercot: 11.8, spp: 5.6 },
  { month: 'Apr', caiso: 7.8, ercot: 12.8, spp: 6.2 },
  { month: 'May', caiso: 8.2, ercot: 13.5, spp: 6.5 },
  { month: 'Jun', caiso: 8.5, ercot: 14.2, spp: 6.8 },
  { month: 'Jul', caiso: 8.1, ercot: 13.2, spp: 6.4 },
  { month: 'Aug', caiso: 7.9, ercot: 12.4, spp: 5.9 },
  { month: 'Sep', caiso: 7.6, ercot: 11.9, spp: 5.7 },
  { month: 'Oct', caiso: 7.8, ercot: 12.5, spp: 5.9 },
];

// Custom tooltip with GridStor styling
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
              className="font-mono font-bold"
              style={{ color: entry.color }}
            >
              ${entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function LineChartExample() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Price Trends"
          description="Historical market price analysis across regions"
        />

        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            title="Market Price History"
            accentColor="blue"
            timestamp="Oct 17, 2025 3:00 PM"
            description="Monthly average prices ($/kW-month) by market region"
          >
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={priceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
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
                    value: '$/kW-month',
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
                <Line
                  type="monotone"
                  dataKey="caiso"
                  name="CAISO"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="ercot"
                  name="ERCOT"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="spp"
                  name="SPP"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
