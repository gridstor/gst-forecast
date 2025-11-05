/**
 * MetricBox Component
 * 
 * Displays a single metric with label, value, and optional unit.
 * Part of the GridStor design system for consistent data display.
 */

import React from 'react';

interface MetricBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'neutral' | 'success' | 'warning' | 'info';
}

export function MetricBox({ label, value, unit, variant = 'neutral' }: MetricBoxProps) {
  const backgrounds = {
    neutral: 'bg-gray-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50',
  };

  return (
    <div className={`${backgrounds[variant]} rounded-lg p-4`}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div 
        className="text-2xl text-gray-900 font-bold"
        style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
      >
        {value}
      </div>
      {unit && (
        <div className="text-xs text-gray-600 mt-1">
          {unit}
        </div>
      )}
    </div>
  );
}

