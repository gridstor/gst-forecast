import React from 'react';

interface MetricBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'neutral' | 'success' | 'warning' | 'info';
}

export function MetricBox({ label, value, unit, variant = 'neutral' }: MetricBoxProps) {
  const backgrounds = {
    neutral: 'bg-[#F9FAFB]',
    success: 'bg-[#ECFDF5]',
    warning: 'bg-[#FEF3C7]',
    info: 'bg-[#EFF6FF]',
  };

  return (
    <div className={`${backgrounds[variant]} rounded-md p-3`}>
      <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="font-mono text-lg text-[#111827]" style={{ fontWeight: 700 }}>
        {value}
      </div>
      {unit && (
        <div className="text-xs text-[#4B5563] mt-0.5">
          {unit}
        </div>
      )}
    </div>
  );
}
