/**
 * ChartCard Component
 * 
 * A specialized card for displaying charts (line, bar, area, etc.) with the GridStor design system aesthetic.
 * Wraps charts in a consistent card layout with optional title, timestamp, and metrics.
 */

import React from 'react';

export interface ChartCardProps {
  title: string;
  accentColor?: 'blue' | 'red' | 'green' | 'purple' | 'gray';
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
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-gray-900 m-0">{title}</h3>
          {timestamp && (
            <span className="text-gray-500 text-xs whitespace-nowrap ml-4">
              {timestamp}
            </span>
          )}
        </div>
        {description && (
          <p className="text-gray-600 text-sm m-0 mt-1">{description}</p>
        )}
      </div>

      {/* Chart Content */}
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}
