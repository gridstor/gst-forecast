import React from 'react';
import { Clock } from 'lucide-react';
import { MetricBox } from './MetricBox';
import { MarketBadge } from './MarketBadge';
import { YoYIndicator } from './YoYIndicator';

export type AccentColor = 'blue' | 'red' | 'green' | 'purple' | 'gray';

interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'neutral' | 'success' | 'warning' | 'info';
}

interface MarketCardProps {
  marketName: string;
  badge?: string;
  accentColor: AccentColor;
  timestamp?: string;
  yoyChange?: number;
  metrics: Metric[];
  highlightedMetric?: Metric;
  summaryLeft?: {
    label: string;
    value: string | number;
    unit?: string;
  };
  summaryRight?: {
    label: string;
    value: string | number;
  };
  finalHighlight?: {
    leftLabel: string;
    leftValue: string | number;
    rightLabel: string;
    rightValue: string | number;
  };
}

const accentColors: Record<AccentColor, string> = {
  blue: '#3B82F6',
  red: '#EF4444',
  green: '#10B981',
  purple: '#8B5CF6',
  gray: '#6B7280',
};

export function MarketCard({
  marketName,
  badge,
  accentColor,
  timestamp,
  yoyChange,
  metrics,
  highlightedMetric,
  summaryLeft,
  summaryRight,
  finalHighlight,
}: MarketCardProps) {
  return (
    <div
      className="bg-white rounded-lg p-6 transition-all duration-200 ease-in-out hover:-translate-y-1"
      style={{
        borderLeft: `4px solid ${accentColors[accentColor]}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      {/* Timestamp Bar */}
      {timestamp && (
        <div className="pb-3 mb-4 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <Clock className="w-3 h-3" />
            <span>Last updated: {timestamp}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <h3 className="text-xl text-[#1F2937]" style={{ fontWeight: 600 }}>
            {marketName}
          </h3>
          {badge && <MarketBadge text={badge} />}
        </div>
        {yoyChange !== undefined && <YoYIndicator value={yoyChange} />}
      </div>

      {/* Metrics Grid */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <MetricBox
              key={index}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              variant={metric.variant}
            />
          ))}
        </div>
      )}

      {/* Highlighted Metric */}
      {highlightedMetric && (
        <div className="mb-6">
          <MetricBox
            label={highlightedMetric.label}
            value={highlightedMetric.value}
            unit={highlightedMetric.unit}
            variant={highlightedMetric.variant || 'warning'}
          />
        </div>
      )}

      {/* Summary Section */}
      {(summaryLeft || summaryRight) && (
        <div className="pt-4 mb-4 border-t border-[#E5E7EB]">
          <div className="flex justify-between items-center">
            {summaryLeft && (
              <div>
                <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">
                  {summaryLeft.label}
                </div>
                <div className="font-mono text-lg text-[#111827]" style={{ fontWeight: 700 }}>
                  {summaryLeft.value}
                </div>
                {summaryLeft.unit && (
                  <div className="text-xs text-[#4B5563]">{summaryLeft.unit}</div>
                )}
              </div>
            )}
            {summaryRight && (
              <div className="text-right">
                <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">
                  {summaryRight.label}
                </div>
                <div className="font-mono text-base text-[#111827]" style={{ fontWeight: 700 }}>
                  {summaryRight.value}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Highlight Box */}
      {finalHighlight && (
        <div className="bg-[#ECFDF5] rounded-md p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
                {finalHighlight.leftLabel}
              </div>
              <div className="font-mono text-base text-[#111827]" style={{ fontWeight: 700 }}>
                {finalHighlight.leftValue}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
                {finalHighlight.rightLabel}
              </div>
              <div className="font-mono text-base text-[#111827]" style={{ fontWeight: 700 }}>
                {finalHighlight.rightValue}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
