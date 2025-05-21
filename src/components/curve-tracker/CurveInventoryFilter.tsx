import { useState } from 'react';

interface FilterState {
  sourceType: string;
  provider: string;
  market: string;
  location: string;
  curveType: string;
  granularity: string;
  modelType: string;
  groupBy: string;
}

interface FilterPanelProps {
  onFilterChange?: (filters: FilterState) => void;
  onGroupingChange?: (grouping: string) => void;
}

const SOURCE_TYPES = ['All', 'External', 'Internal'];
const PROVIDERS = ['All', 'Aurora', 'GST'];
const MARKETS = ['All', 'ERCOT', 'CAISO'];
const LOCATIONS = [
  'All',
  // ERCOT locations
  'ERCOT-Odessa',
  'ERCOT-Hidden Lakes',
  'ERCOT-Gunner Noodles',
  'ERCOT-Houston Hub',
  'ERCOT-South Hub',
  'ERCOT-West Hub',
  // CAISO locations
  'CAISO-Goleta',
  'CAISO-SFS Noodles',
  'CAISO-SP15 Hub',
  'CAISO-NP15 Hub'
];
const CURVE_TYPES = [
  'All',
  'Energy Arbitrage',
  'Ancillary Services',
  'Total Revenue',
  'TB2 Energy',
  'TB4 Energy',
  'Resource Adequacy',
  'Regulation Up',
  'Regulation Down',
  'Spin',
  'Non-Spin',
  'ECRS'
];
const GRANULARITIES = ['All', 'Annual', 'Monthly'];
const MODEL_TYPES = ['All', 'Historical', 'Quantitative', 'Fundamentals'];
const GROUP_BY = ['None', 'Source Type', 'Market', 'Location', 'Curve Type', 'Granularity', 'Model Type'];

export default function CurveInventoryFilter({ onFilterChange, onGroupingChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    sourceType: 'All',
    provider: 'All',
    market: 'All',
    location: 'All',
    curveType: 'All',
    granularity: 'All',
    modelType: 'All',
    groupBy: 'None'
  });

  const [showFilters, setShowFilters] = useState(true);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);

    // Update location options based on market selection
    if (key === 'market' && value !== 'All') {
      const marketPrefix = value + '-';
      if (!LOCATIONS.find(loc => loc.startsWith(marketPrefix) && filters.location.startsWith(marketPrefix))) {
        handleFilterChange('location', 'All');
      }
    }
  };

  const handleGroupingChange = (value: string) => {
    handleFilterChange('groupBy', value);
    onGroupingChange?.(value);
  };

  const renderSelect = (
    label: string,
    key: keyof FilterState,
    options: string[],
    onChange = handleFilterChange
  ) => (
    <div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4 px-2 mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={filters[key]}
        onChange={(e) => onChange(key, e.target.value)}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
    <div className="bg-gray-50 p-4 rounded-t-lg border-b border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filter & Group Curves</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-gray-600 hover:text-gray-900"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap -mx-2">
          {renderSelect('Source Type', 'sourceType', SOURCE_TYPES)}
          {renderSelect('Provider', 'provider', PROVIDERS)}
          {renderSelect('Market', 'market', MARKETS)}
          {renderSelect('Location', 'location', LOCATIONS.filter(loc =>
            filters.market === 'All' ? true : loc === 'All' || loc.startsWith(filters.market + '-')
          ))}
          {renderSelect('Curve Type', 'curveType', CURVE_TYPES)}
          {renderSelect('Granularity', 'granularity', GRANULARITIES)}
          {filters.sourceType === 'Internal' && renderSelect('Model Type', 'modelType', MODEL_TYPES)}
          {renderSelect('Group By', 'groupBy', GROUP_BY, handleGroupingChange)}
        </div>
      )}

      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={() => {
            const defaultFilters = {
              sourceType: 'All',
              provider: 'All',
              market: 'All',
              location: 'All',
              curveType: 'All',
              granularity: 'All',
              modelType: 'All',
              groupBy: 'None'
            };
            setFilters(defaultFilters);
            onFilterChange?.(defaultFilters);
            onGroupingChange?.('None');
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Reset Filters
        </button>
        <button
          onClick={() => onFilterChange?.(filters)}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Apply Filters
        </button>
        <button
          onClick={() => {
            // Save current filters to localStorage
            localStorage.setItem('curveInventoryFilters', JSON.stringify(filters));
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save Filters
        </button>
      </div>
    </div>
  );
} 