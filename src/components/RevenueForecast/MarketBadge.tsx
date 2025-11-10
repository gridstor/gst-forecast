import React from 'react';

export type Market = 'CAISO' | 'ERCOT' | 'SPP';

interface MarketBadgeProps {
  market: Market;
  size?: 'sm' | 'md';
}

const marketColors: Record<Market, { bg: string; text: string; dot: string }> = {
  CAISO: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500'
  },
  ERCOT: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500'
  },
  SPP: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  }
};

export function MarketBadge({ market, size = 'sm' }: MarketBadgeProps) {
  const colors = marketColors[market];
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-xs';

  return (
    <div className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} ${sizeClasses} font-bold rounded uppercase tracking-wider`}>
      <div className={`${colors.dot} rounded-full w-1.5 h-1.5`} />
      {market}
    </div>
  );
}

