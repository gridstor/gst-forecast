import React from 'react';
import { MarketBadge, type Market } from './MarketBadge';
import { MetricBox } from './MetricBox';

interface LocationCardProps {
  name: string;
  type: 'Hub' | 'Node' | string;
  market: Market;
  badges?: string[];
  selectedBadge?: string;
  onBadgeToggle?: (badge: string) => void;
  metrics: {
    energyArb: string;
    as: string;
    cap: string;
    total: string;
    p95: string;
    p50: string;
    p05: string;
  };
  curveCreator?: string;
  creationDate?: string;
  isSelected?: boolean;
  isEmpty?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const marketColors: Record<Market, { border: string; badge: string; total: string; dot: string }> = {
  CAISO: {
    border: 'border-blue-500',
    badge: 'bg-blue-500',
    total: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500'
  },
  ERCOT: {
    border: 'border-red-500',
    badge: 'bg-red-500',
    total: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500'
  },
  SPP: {
    border: 'border-emerald-500',
    badge: 'bg-emerald-500',
    total: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  }
};

export function LocationCard({
  name,
  type,
  market,
  badges,
  selectedBadge,
  onBadgeToggle,
  metrics,
  curveCreator,
  creationDate,
  isSelected,
  isEmpty,
  compact,
  onClick
}: LocationCardProps) {
  const colors = marketColors[market];

  if (isEmpty) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[180px]">
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          No Data
        </div>
      </div>
    );
  }

  // Compact version for sidebar
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`bg-white dark:bg-[#2A2A2A] rounded-md p-2 transition-all duration-200 cursor-pointer border-l-2
          ${isSelected
            ? `${colors.badge.replace('bg-', 'border-')} shadow-md`
            : 'border-gray-200 dark:border-gray-700 hover:shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <div className={`${colors.badge} rounded-full w-1 h-1`} />
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {selectedBadge || name}
            </h4>
          </div>
          <div className={`font-mono font-bold text-xs ${colors.total}`}>
            {metrics.total}
          </div>
        </div>
        <div className="text-[8px] text-gray-500 dark:text-gray-400 tracking-wider mb-1">
          {type}
        </div>
        <div className="flex gap-1 text-[8px]">
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded px-1 py-0.5">
            <div className="text-gray-500 dark:text-gray-400">ARB</div>
            <div className="font-mono font-bold text-gray-900 dark:text-gray-100">{metrics.energyArb}</div>
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded px-1 py-0.5">
            <div className="text-gray-500 dark:text-gray-400">AS</div>
            <div className="font-mono font-bold text-gray-900 dark:text-gray-100">{metrics.as}</div>
          </div>
        </div>
      </div>
    );
  }

  // Full card version - matching Figma design
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#2A2A2A] rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${colors.border} cursor-pointer
        ${isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 shadow-lg'
          : ''
        }`}
    >
      {/* Header: Market + Type + Location Name */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className={`${colors.badge} text-white text-[9px] px-1.5 py-0.5 rounded font-bold`}>
            {market}
          </div>
          <div className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {type}
          </div>
        </div>
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {selectedBadge || name}
          </h4>
          <div className="text-right">
            <div className={`font-mono font-bold text-sm ${colors.total}`}>
              {metrics.total}<span className="text-[9px] text-gray-400 dark:text-gray-500 font-normal">/kW-mn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-2" />

      {/* P50 Revenue Components Section */}
      <div className="mb-2">
        <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          P50 Revenue Components
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-1.5 text-center">
            <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
              ARB
            </div>
            <div className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100">
              {metrics.energyArb}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-1.5 text-center">
            <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
              AS
            </div>
            <div className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100">
              {metrics.as}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-1.5 text-center">
            <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
              CAP
            </div>
            <div className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100">
              {metrics.cap}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-2" />

      {/* Forecast Scenarios Section */}
      <div className="mb-2">
        <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          Forecast Scenarios
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-1.5 text-center">
            <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
              P95
            </div>
            <div className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100">
              {metrics.p95}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-1.5 text-center">
            <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
              P50
            </div>
            <div className={`font-mono font-bold text-xs ${colors.total}`}>
              {metrics.p50}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-1.5 text-center">
            <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
              P05
            </div>
            <div className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100">
              {metrics.p05}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-2" />

      {/* Footer */}
      <div className="text-[9px] text-center text-gray-500 dark:text-gray-400">
        <div>Curve Creator: {(curveCreator || 'Unknown').replace('GridStor P50', 'GridStor').replace('ASCEND Forecast', 'ASCEND')}</div>
        <div>Creation Date: {creationDate || 'Unknown'}</div>
      </div>
    </div>
  );
}

