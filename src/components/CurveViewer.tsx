import React, { useState, useEffect } from 'react';
import { DualChartSystem } from './DualChartSystem';
import { LocationSelector } from './common/LocationSelector';
import type { CurveData, LocationOption, Granularity, CurveDefinition } from '../lib/types';
import { fetchLocations, fetchCurveDefinitions, fetchCurvesByLocation, fetchCurveData } from '../lib/api-client';
import { useCurves } from '../lib/hooks/useCurves';

const DEFAULT_LOCATION = 'CAISO-Goleta';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });
};

interface CurveStyle {
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

interface CurveSelectionProps {
  location: string;
  selectedCurves: number[];
  onCurveToggle: (curveId: number, style?: CurveStyle) => void;
  granularity: Granularity;
  availableCurves: CurveDefinition[];
}

const COLORS = [
  '#2AB3CB',  // Bright turquoise
  '#1D7874',  // Teal green
  '#679289',  // Sage green
  '#F4C095',  // Peach
  '#E2231A',  // Red
  '#4F46E5',  // Indigo
  '#10B981',  // Emerald
  '#F59E0B',  // Amber
  '#EC4899',  // Pink
  '#8B5CF6'   // Purple
];

const LINE_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' }
];

const CurveSelection: React.FC<CurveSelectionProps> = ({ 
  location, 
  selectedCurves, 
  onCurveToggle,
  granularity,
  availableCurves
}) => {
  const [filters, setFilters] = useState({
    mark_case: '',
    mark_date: '',
    curve_creator: '',
    color: COLORS[0],
    lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted'
  });

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Get unique values for dropdowns from all available curves
  const uniqueValues = React.useMemo(() => {
    return availableCurves.reduce((acc, curve) => {
      if (!acc.mark_cases.includes(curve.mark_case)) acc.mark_cases.push(curve.mark_case);
      if (!acc.curve_creators.includes(curve.curve_creator)) {
        acc.curve_creators.push(curve.curve_creator);
      }
      if (curve.mark_date && !acc.mark_dates.includes(curve.mark_date.toString())) {
        acc.mark_dates.push(curve.mark_date.toString());
      }
      return acc;
    }, {
      mark_cases: [] as string[],
      curve_creators: [] as string[],
      mark_dates: [] as string[]
    });
  }, [availableCurves]);

  // Sort function
  const sortedCurves = React.useMemo(() => {
    let sortedData = [...availableCurves];
    if (sortConfig) {
      sortedData.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedData;
  }, [availableCurves, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter function
  const filteredCurves = sortedCurves.filter(curve => {
    const matches = (!filters.mark_case || curve.mark_case === filters.mark_case) &&
           (!filters.mark_date || curve.mark_date?.toString() === filters.mark_date) &&
           (!filters.curve_creator || curve.curve_creator === filters.curve_creator);
    return matches;
  });

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return '▲▼';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  // Handle adding a curve when filters are set
  const handleAddCurve = () => {
    console.log('Handling add curve with filters:', filters);
    console.log('Filtered curves:', filteredCurves);
    const matchingCurves = filteredCurves.filter(curve => !selectedCurves.includes(curve.curve_id));
    console.log('Matching curves not already selected:', matchingCurves);
    if (matchingCurves.length > 0) {
      console.log('Adding curve:', matchingCurves[0]);
      onCurveToggle(matchingCurves[0].curve_id, {
        color: filters.color,
        lineStyle: filters.lineStyle
      });
      setFilters(prev => ({
        ...prev,
        mark_case: '',
        mark_date: '',
        curve_creator: '',
        color: COLORS[(COLORS.indexOf(prev.color) + 1) % COLORS.length]
      }));
    }
  };

  return (
    <div className="mt-6">
      {/* Current Curves */}
      <div className="mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('curve_id')}>
                  ID {getSortIndicator('curve_id')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('mark_case')}>
                  Case {getSortIndicator('mark_case')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('mark_date')}>
                  Date {getSortIndicator('mark_date')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('curve_creator')}>
                  Creator {getSortIndicator('curve_creator')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCurves
                .filter(curve => selectedCurves.includes(curve.curve_id))
                .map(curve => (
                  <tr key={curve.curve_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{curve.curve_id}</td>
                    <td className="px-3 py-2 text-sm">{curve.mark_case}</td>
                    <td className="px-3 py-2 text-sm">{formatDate(curve.mark_date.toString())}</td>
                    <td className="px-3 py-2 text-sm">{curve.curve_creator}</td>
                    <td className="px-3 py-2 text-sm">
                      <button
                        onClick={() => onCurveToggle(curve.curve_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Curve */}
      <div className="grid grid-cols-6 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Case</label>
          <select
            value={filters.mark_case}
            onChange={(e) => setFilters(prev => ({ ...prev, mark_case: e.target.value }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Case</option>
            {uniqueValues.mark_cases.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <select
            value={filters.mark_date}
            onChange={(e) => setFilters(prev => ({ ...prev, mark_date: e.target.value }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Date</option>
            {uniqueValues.mark_dates
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map(value => (
                <option key={value} value={value}>
                  {formatDate(value)}
                </option>
              ))
            }
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Creator</label>
          <select
            value={filters.curve_creator}
            onChange={(e) => setFilters(prev => ({ ...prev, curve_creator: e.target.value }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Creator</option>
            {uniqueValues.curve_creators.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
          <select
            value={filters.color}
            onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            {COLORS.map(color => (
              <option key={color} value={color} style={{ backgroundColor: color, color: '#FFF' }}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Line Style</label>
          <select
            value={filters.lineStyle}
            onChange={(e) => setFilters(prev => ({ ...prev, lineStyle: e.target.value as 'solid' | 'dashed' | 'dotted' }))}
            className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            {LINE_STYLES.map(style => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAddCurve}
            disabled={filteredCurves.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Curve
          </button>
        </div>
      </div>
    </div>
  );
};

export const CurveViewer: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [monthlyDefinitions, setMonthlyDefinitions] = useState<CurveDefinition[]>([]);
  const [annualDefinitions, setAnnualDefinitions] = useState<CurveDefinition[]>([]);
  const [curveStyles, setCurveStyles] = useState<Record<number, CurveStyle>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const { 
    curves, 
    monthlyData, 
    annualData, 
    loading, 
    error,
    monthlyCurves,
    setMonthlyCurves,
    annualCurves,
    setAnnualCurves
  } = useCurves(location);

  useEffect(() => {
    fetchLocations()
      .then(data => {
        setLocations(data);
        if (!data.some(loc => loc.id === DEFAULT_LOCATION)) {
          setLocation(data[0]?.id || '');
        }
      })
      .catch(error => {
        console.error('Failed to fetch locations:', error);
      });
  }, []);

  // Fetch all available curve definitions when location changes
  useEffect(() => {
    if (location) {
      // Fetch all curves for this location
      fetchCurvesByLocation(location)
        .then(data => {
          console.log('All curves for location:', data);
          // Split into monthly and annual
          const monthly = data.filter(curve => curve.granularity?.toLowerCase() === 'monthly');
          const annual = data.filter(curve => curve.granularity?.toLowerCase() === 'annual');
          console.log('Monthly definitions:', monthly);
          console.log('Annual definitions:', annual);
          setMonthlyDefinitions(monthly);
          setAnnualDefinitions(annual);
        })
        .catch(console.error);
    }
  }, [location]);

  const handleMonthlyCurveToggle = (curveId: number, style?: CurveStyle) => {
    console.log('Toggling monthly curve:', curveId, style);
    console.log('Current monthly curves:', monthlyCurves);
    if (style) {
      setCurveStyles(prev => ({ ...prev, [curveId]: style }));
    }
    setMonthlyCurves(prev => {
      const newCurves = prev.includes(curveId) 
        ? prev.filter(id => id !== curveId)
        : [...prev, curveId];
      console.log('New monthly curves:', newCurves);
      return newCurves;
    });
  };

  const handleAnnualCurveToggle = (curveId: number, style?: CurveStyle) => {
    console.log('Toggling annual curve:', curveId, style);
    console.log('Current annual curves:', annualCurves);
    if (style) {
      setCurveStyles(prev => ({ ...prev, [curveId]: style }));
    }
    setAnnualCurves(prev => {
      const newCurves = prev.includes(curveId) 
        ? prev.filter(id => id !== curveId)
        : [...prev, curveId];
      console.log('New annual curves:', newCurves);
      return newCurves;
    });
  };

  // Add styles to the data
  const monthlyDataWithStyles = monthlyData.map(curve => ({
    ...curve,
    style: curveStyles[curve.curveId]
  }));

  const annualDataWithStyles = annualData.map(curve => ({
    ...curve,
    style: curveStyles[curve.curveId]
  }));

  const handleDownloadGraphData = async (data: (CurveData & { style?: { color: string; lineStyle: 'solid' | 'dashed' | 'dotted' } })[], granularity: 'monthly' | 'annual') => {
    try {
      if (!data || data.length === 0) {
        return;
      }

      // Group data by curve
      const groupedData = data.reduce((acc, row) => {
        const key = `${row.curveId}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as Record<string, typeof data>);

      // Create CSV content with multiple curves
      const headers = ['Date'];
      const curveLabels = Object.entries(groupedData).map(([_, curves]) => {
        const firstCurve = curves[0] as CurveData;
        return `${firstCurve.curve_creator} - ${firstCurve.mark_case} (${formatDate(firstCurve.mark_date)})`;
      });
      headers.push(...curveLabels);

      // Get all unique dates
      const allDates = [...new Set(data.map(row => row.date))].sort();

      // Create rows with all curves
      const rows = allDates.map(date => {
        const row = [new Date(date).toLocaleDateString()];
        Object.values(groupedData).forEach(curves => {
          const matchingPoint = (curves as CurveData[]).find(c => c.date === date);
          row.push(matchingPoint ? matchingPoint.value.toString() : '');
        });
        return row.join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${location}_${granularity}_curves.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download graph data:', err);
    }
  };

  if (!mounted) {
    return null;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
        Error: {error}
      </div>
    );
  }

  console.log('Rendering with:', {
    monthlyCurves,
    annualCurves,
    monthlyData,
    annualData,
    monthlyDefinitions,
    annualDefinitions
  });

  return (
    <div className="max-w-[1920px] mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold whitespace-nowrap">Select a Location</h1>
          <LocationSelector 
            value={location} 
            onChange={setLocation}
            locations={locations}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="space-y-3 mt-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Monthly Revenue ($/kw-month) - Front 24 Months</h2>
              <button
                onClick={() => handleDownloadGraphData(monthlyDataWithStyles, 'monthly')}
                disabled={monthlyDataWithStyles.length === 0}
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download Graph Data
              </button>
            </div>
            <DualChartSystem 
              data={monthlyDataWithStyles} 
              title="Monthly Prices"
              granularity="monthly"
              height={400}
            />
            <CurveSelection
              location={location}
              selectedCurves={monthlyCurves}
              onCurveToggle={handleMonthlyCurveToggle}
              granularity="monthly"
              availableCurves={monthlyDefinitions}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Annual Revenue ($/kw-year) - Front 10 Years</h2>
              <button
                onClick={() => handleDownloadGraphData(annualDataWithStyles, 'annual')}
                disabled={annualDataWithStyles.length === 0}
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download Graph Data
              </button>
            </div>
            <DualChartSystem 
              data={annualDataWithStyles}
              title="Annual Prices"
              granularity="annual"
              height={400}
            />
            <CurveSelection
              location={location}
              selectedCurves={annualCurves}
              onCurveToggle={handleAnnualCurveToggle}
              granularity="annual"
              availableCurves={annualDefinitions}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 