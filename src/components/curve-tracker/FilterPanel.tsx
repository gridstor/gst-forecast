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

  useEffect(() => {
    const event = new CustomEvent('filterchange', { detail: filters });
    window.dispatchEvent(event);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const renderSelect = (
    label: string,
    key: keyof FilterState,
    options: string[]
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={filters[key]}
        onChange={(e) => handleFilterChange(key, e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h2 className="text-lg font-semibold mb-4">Filter Curves</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {renderSelect('Market', 'market', MARKETS)}
        {renderSelect('Location', 'location', LOCATIONS)}
        {renderSelect('Source Type', 'sourceType', SOURCE_TYPES)}
        {renderSelect('Granularity', 'granularity', GRANULARITIES)}
        {renderSelect('Model Type', 'modelType', MODEL_TYPES)}
        {renderSelect('Status', 'status', STATUSES)}
      </div>
    </div>
  );
} 