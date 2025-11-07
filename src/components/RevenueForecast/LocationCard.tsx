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

const marketColors: Record<Market, { badge: string; total: string }> = {
  CAISO: {
    badge: 'bg-blue-500',
    total: 'text-blue-600 dark:text-blue-400'
  },
  ERCOT: {
    badge: 'bg-red-500',
    total: 'text-red-600 dark:text-red-400'
  },
  SPP: {
    badge: 'bg-emerald-500',
    total: 'text-emerald-600 dark:text-emerald-400'
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

  // Full card version
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#2A2A2A] rounded-lg p-2.5 transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 shadow-lg'
          : 'shadow-sm hover:shadow-md'
        }`}
    >
      {/* Badges - Radio Selection */}
      {badges && badges.length > 0 && (
        <div className="flex gap-0.5 mb-1.5">
          {badges.map((badge, idx) => {
            const isBadgeSelected = selectedBadge === badge;
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onBadgeToggle?.(badge);
                }}
                className={`text-[9px] px-1.5 py-0.5 rounded transition-all duration-200 cursor-pointer hover:scale-105 ${
                  isBadgeSelected
                    ? `${colors.badge} text-white font-semibold shadow-sm`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-50 hover:opacity-75'
                }`}
                title={`Select ${badge} location`}
              >
                {badge}
              </button>
            );
          })}
        </div>
      )}

      {/* Header: Name + Total */}
      <div className="flex items-start justify-between mb-0.5">
        <div className="flex items-center gap-1">
          <div className={`${colors.badge} rounded-full w-1.5 h-1.5`} />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {selectedBadge || name}
          </h4>
        </div>
        <div className="text-right">
          <div className={`font-mono font-bold text-sm ${colors.total}`}>
            {metrics.total}<span className="text-[9px] text-gray-400 dark:text-gray-500 font-normal">/kW-mn</span>
          </div>
        </div>
      </div>

      {/* Type */}
      <div className="text-[9px] text-gray-500 dark:text-gray-400 tracking-wider mb-2">
        {type}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-2" />

      {/* P50 Revenue Components */}
      <div className="mb-2">
        <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          P50 Revenue Components
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <MetricBox label="ARB" value={metrics.energyArb} size="sm" />
          <MetricBox label="AS" value={metrics.as} size="sm" />
          <MetricBox label="CAP" value={metrics.cap} size="sm" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-2" />

      {/* Forecast Scenarios */}
      <div className="mb-2">
        <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          Forecast Scenarios
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <MetricBox label="P95" value={metrics.p95} size="sm" />
          <MetricBox label="P50" value={metrics.p50} size="sm" variant="info" />
          <MetricBox label="P05" value={metrics.p05} size="sm" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-2" />

      {/* Footer */}
      <div className="text-[9px] text-center text-gray-500 dark:text-gray-400">
        <div>Curve Creator: {curveCreator || 'Unknown'}</div>
        <div>Creation Date: {creationDate || 'Unknown'}</div>
      </div>
    </div>
  );
}

