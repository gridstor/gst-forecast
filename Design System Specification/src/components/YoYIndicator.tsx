import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface YoYIndicatorProps {
  value: number;
  format?: 'percentage' | 'value';
}

export function YoYIndicator({ value, format = 'percentage' }: YoYIndicatorProps) {
  const isPositive = value > 0;
  const color = isPositive ? '#059669' : '#DC2626';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  const displayValue = format === 'percentage' 
    ? `${Math.abs(value)}%` 
    : Math.abs(value).toFixed(2);

  return (
    <div className="flex items-center gap-1" style={{ color }}>
      <Icon className="w-4 h-4" />
      <span className="text-sm" style={{ fontWeight: 600 }}>
        {isPositive ? '+' : '-'}{displayValue}
      </span>
    </div>
  );
}
