import { useState, useEffect } from 'react';

export interface FilterState {
  market: string;
  location: string;
  sourceType: string;
  granularity: string;
  modelType: string;
  status: string;
}

interface FilterPanelProps {
  onFilterChange?: (filters: FilterState) => void;
}

const MARKETS = ['All', 'ERCOT', 'CAISO'];
const LOCATIONS = ['All', 'NP15', 'SP15', 'Goleta', 'Hidden Lakes', 'Houston'];
const SOURCE_TYPES = ['All', 'Internal', 'External'];
const GRANULARITIES = ['All', 'Annual', 'Monthly'];
const MODEL_TYPES = ['All', 'Historical', 'Quantitative', 'Fundamentals'];
const STATUSES = ['All', 'On Track', 'Due Soon', 'Overdue'];

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    market: 'All',
    location: 'All',
    sourceType: 'All',
    granularity: 'All',
    modelType: 'All',
    status: 'All'
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    const event = new CustomEvent('filterchange', { detail: filters });
    window.dispatchEvent(event);
    
    onFilterChange?.(filters);
  };

  const renderSelect = (
    label: string,
    key: keyof FilterState,
    options: string[]
  ) => (
    <div>
      <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        value={filters[key]}
        onChange={(e) => handleFilterChange(key, e.target.value)}
        className="block w-full rounded-md border border-[#E5E7EB] py-2 px-3 text-sm bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="bg-[#F9FAFB] p-6 rounded-lg mb-6 border border-[#E5E7EB]">
      <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Filter Curves</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {renderSelect('Market', 'market', MARKETS)}
        {renderSelect('Location', 'location', LOCATIONS)}
        {renderSelect('Source Type', 'sourceType', SOURCE_TYPES)}
        {renderSelect('Granularity', 'granularity', GRANULARITIES)}
        {renderSelect('Model Type', 'modelType', MODEL_TYPES)}
        {renderSelect('Status', 'status', STATUSES)}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={applyFilters}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3B82F6] rounded-md hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
} 