import React, { useState } from 'react';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { MarketBadge, type Market } from './MarketBadge';

interface SelectedCurve {
  id: string;
  name: string;
  specificLocation?: string;
  market: Market;
}

interface GraphViewTopBarProps {
  selectedLocation: {
    name: string;
    market: Market;
    specificLocation?: string;
  };
  chartViewMode: 'monthly' | 'annual';
  dateRange: string;
  fromMonth: string;
  toMonth: string;
  addedCurves: SelectedCurve[];
  onBack: () => void;
  onChartViewModeChange: (mode: 'monthly' | 'annual') => void;
  onDateRangeChange: (range: string) => void;
  onFromMonthChange: (month: string) => void;
  onToMonthChange: (month: string) => void;
  onAddCurve: () => void;
  onRemoveCurve: (index: number) => void;
}

export function GraphViewTopBar({
  selectedLocation,
  chartViewMode,
  dateRange,
  fromMonth,
  toMonth,
  addedCurves,
  onBack,
  onChartViewModeChange,
  onDateRangeChange,
  onFromMonthChange,
  onToMonthChange,
  onAddCurve,
  onRemoveCurve
}: GraphViewTopBarProps) {
  return (
    <div className="bg-white dark:bg-[#2A2A2A] shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-1.5">
      {/* Main Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Back Button + Location */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <ChevronLeft className="w-3 h-3" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {selectedLocation.specificLocation || selectedLocation.name}
            </h2>
            <MarketBadge market={selectedLocation.market} />
          </div>
        </div>

        {/* Center: Chart View Toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-500 dark:text-gray-400">View:</span>
          <div className="flex rounded shadow-sm">
            <button
              onClick={() => onChartViewModeChange('monthly')}
              className={`px-1.5 py-0.5 text-[9px] font-medium rounded-l border transition-colors ${
                chartViewMode === 'monthly'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => onChartViewModeChange('annual')}
              className={`px-1.5 py-0.5 text-[9px] font-medium rounded-r border-t border-r border-b transition-colors ${
                chartViewMode === 'annual'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Right: Time Period Controls + Add Curve */}
        <div className="flex items-center gap-3">
          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500 dark:text-gray-400">Next:</span>
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded p-0.5">
              {['1y', '5y', '10y', 'lifetime'].map((range) => (
                <button
                  key={range}
                  onClick={() => onDateRangeChange(range)}
                  className={`px-1 py-0.5 text-[9px] font-medium rounded transition-colors ${
                    dateRange === range
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {range === 'lifetime' ? 'Lifetime' : range}
                </button>
              ))}
            </div>
          </div>

          {/* Month Range Dropdowns */}
          <div className="flex items-center gap-0.5">
            <select
              value={fromMonth}
              onChange={(e) => {
                onFromMonthChange(e.target.value);
                onDateRangeChange('custom');
              }}
              className="w-[90px] h-5 text-[9px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1"
            >
              <option value="">Start</option>
              <option value="2025-01">Jan 2025</option>
              <option value="2025-06">Jun 2025</option>
              <option value="2025-12">Dec 2025</option>
              <option value="2026-01">Jan 2026</option>
              <option value="2026-06">Jun 2026</option>
              <option value="2026-12">Dec 2026</option>
            </select>
            <span className="text-[9px] text-gray-400">→</span>
            <select
              value={toMonth}
              onChange={(e) => {
                onToMonthChange(e.target.value);
                onDateRangeChange('custom');
              }}
              className="w-[90px] h-5 text-[9px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1"
            >
              <option value="">End</option>
              <option value="2026-12">Dec 2026</option>
              <option value="2027-12">Dec 2027</option>
              <option value="2030-12">Dec 2030</option>
            </select>
          </div>

          {/* Add Curve Button */}
          <button
            onClick={onAddCurve}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" />
            Add Curve
          </button>
        </div>
      </div>

      {/* Active Curves Row */}
      {addedCurves.length > 0 && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-[9px] text-gray-500 dark:text-gray-400">Comparing:</span>
          <div className="flex flex-wrap gap-1">
            {addedCurves.map((curve, idx) => (
              <div
                key={`${curve.market}-${curve.name}-${idx}`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium ${
                  curve.market === 'CAISO' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  curve.market === 'ERCOT' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <span>{curve.specificLocation || curve.name}</span>
                <button
                  onClick={() => onRemoveCurve(idx)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

