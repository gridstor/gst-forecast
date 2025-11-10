import React from 'react';

interface MetricBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'neutral' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export function MetricBox({ label, value, unit, variant = 'neutral', size = 'md' }: MetricBoxProps) {
  const backgrounds = {
    neutral: 'bg-gray-50 dark:bg-gray-800',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
  };

  const textSize = size === 'sm' ? 'text-xs' : 'text-lg';
  const labelSize = size === 'sm' ? 'text-[9px]' : 'text-xs';
  const padding = size === 'sm' ? 'p-1.5' : 'p-3';

  return (
    <div className={`${backgrounds[variant]} rounded-md ${padding}`}>
      <div className={`${labelSize} font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5`}>
        {label}
      </div>
      <div className={`font-mono ${textSize} font-bold text-gray-900 dark:text-gray-100`}>
        {value}
      </div>
      {unit && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {unit}
        </div>
      )}
    </div>
  );
}

