/**
 * ChartCard Component
 * 
 * A specialized card for displaying charts with the GridStor design system aesthetic.
 * Wraps charts in a consistent card layout with optional title, timestamp, and accent border.
 */

import React from 'react';

export interface ChartCardProps {
  title: string;
  accentColor?: 'blue' | 'red' | 'green' | 'purple' | 'gray' | 'cyan';
  timestamp?: string;
  description?: string;
  children: React.ReactNode;
}

const accentColors: Record<string, string> = {
  blue: '#3B82F6',
  red: '#EF4444',
  green: '#10B981',
  purple: '#8B5CF6',
  gray: '#6B7280',
  cyan: '#06B6D4',
};

export function ChartCard({
  title,
  accentColor = 'blue',
  timestamp,
  description,
  children,
}: ChartCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
      style={{
        borderLeft: `4px solid ${accentColors[accentColor]}`,
      }}
    >
      {/* Compact Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-base font-semibold text-gray-900 m-0">{title}</h3>
          {timestamp && (
            <span className="text-gray-500 text-[10px] whitespace-nowrap ml-4">
              {timestamp}
            </span>
          )}
        </div>
        {description && (
          <p className="text-gray-600 text-xs m-0 mt-0.5">{description}</p>
        )}
      </div>

      {/* Chart Content */}
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

