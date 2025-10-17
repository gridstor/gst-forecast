/**
 * TEMPLATE: Bar Chart Example
 * 
 * Professional bar chart with GridStor design system styling.
 * Shows comparative data across categories with clean formatting.
 * 
 * Usage:
 * - Copy this component
 * - Replace the data array with your data
 * - Customize colors, title, and axis labels as needed
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from '../ChartCard';
import { SectionHeader } from '../SectionHeader';

// Sample data - replace with your own
const capacityData = [
  { region: 'CAISO', capacity: 1250, available: 1180, maintenance: 70 },
  { region: 'ERCOT', capacity: 2150, available: 2010, maintenance: 140 },
  { region: 'SPP', capacity: 950, available: 890, maintenance: 60 },
  { region: 'PJM', capacity: 1680, available: 1590, maintenance: 90 },
  { region: 'NYISO', capacity: 890, available: 845, maintenance: 45 },
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
              style={{ color: entry.fill }}
            >
              {entry.value.toLocaleString()} MW
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function BarChartExample() {
  return (
    <section className="py-12 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Regional Capacity"
          description="Storage capacity breakdown by market region"
        />

        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            title="Capacity Distribution"
            accentColor="green"
            timestamp="Oct 17, 2025 3:00 PM"
            description="Total, available, and maintenance capacity (MW) across regions"
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={capacityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="region"
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
                    value: 'Capacity (MW)',
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
                <Bar
                  dataKey="capacity"
                  name="Total Capacity"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="available"
                  name="Available"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="maintenance"
                  name="Maintenance"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
