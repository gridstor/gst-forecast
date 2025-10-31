import React, { useState, useEffect } from 'react';
import { DualChartSystem } from './DualChartSystem';
import { LocationSelector } from '../common/LocationSelector';
import type { CurveData, LocationOption, Granularity, CurveDefinition } from '../../lib/types';
import { fetchLocations, fetchCurveDefinitions, fetchCurvesByLocation, fetchCurveData } from '../../lib/api-client';
import { useCurves } from '../../lib/hooks/useCurves';

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

// GridStor Design System Color Palette
const COLORS = [
  '#3B82F6',  // Blue - Primary
  '#10B981',  // Green - Success
  '#EF4444',  // Red - Critical
  '#8B5CF6',  // Purple - Special
  '#F59E0B',  // Amber - Warning
  '#06B6D4',  // Cyan - Alternate
  '#EC4899',  // Pink - Accent
  '#6366F1',  // Indigo - Alternate
  '#14B8A6',  // Teal - Alternate
  '#F97316'   // Orange - Alternate
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
    const matchingCurves = filteredCurves.filter(curve => !selectedCurves.includes(curve.curve_id));
    if (matchingCurves.length > 0) {
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
      {/* Current Curves - Design System Table */}
      <div className="mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer" onClick={() => requestSort('curve_id')}>
                  ID {getSortIndicator('curve_id')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer" onClick={() => requestSort('mark_case')}>
                  Case {getSortIndicator('mark_case')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer" onClick={() => requestSort('mark_date')}>
                  Date {getSortIndicator('mark_date')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer" onClick={() => requestSort('curve_creator')}>
                  Creator {getSortIndicator('curve_creator')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              {filteredCurves
                .filter(curve => selectedCurves.includes(curve.curve_id))
                .map(curve => (
                  <tr key={curve.curve_id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-3 py-2 text-sm text-[#111827] font-mono">{curve.curve_id}</td>
                    <td className="px-3 py-2 text-sm text-[#111827]">{curve.mark_case}</td>
                    <td className="px-3 py-2 text-sm text-[#6B7280] font-mono">{formatDate(curve.mark_date.toString())}</td>
                    <td className="px-3 py-2 text-sm text-[#111827]">{curve.curve_creator}</td>
                    <td className="px-3 py-2 text-sm">
                      <button
                        onClick={() => onCurveToggle(curve.curve_id)}
                        className="text-[#EF4444] hover:text-[#DC2626] font-bold transition-colors"
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

      {/* Add New Curve - Design System Styling */}
      <div className="grid grid-cols-6 gap-4 bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
        <div>
          <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Case</label>
          <select
            value={filters.mark_case}
            onChange={(e) => setFilters(prev => ({ ...prev, mark_case: e.target.value }))}
            className="block w-full text-sm border-[#E5E7EB] rounded-md bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
          >
            <option value="">Select Case</option>
            {uniqueValues.mark_cases.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Date</label>
          <select
            value={filters.mark_date}
            onChange={(e) => setFilters(prev => ({ ...prev, mark_date: e.target.value }))}
            className="block w-full text-sm border-[#E5E7EB] rounded-md bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
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
          <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Creator</label>
          <select
            value={filters.curve_creator}
            onChange={(e) => setFilters(prev => ({ ...prev, curve_creator: e.target.value }))}
            className="block w-full text-sm border-[#E5E7EB] rounded-md bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
          >
            <option value="">Select Creator</option>
            {uniqueValues.curve_creators.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Color</label>
          <select
            value={filters.color}
            onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
            className="block w-full text-sm border-[#E5E7EB] rounded-md bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
          >
            {COLORS.map(color => (
              <option key={color} value={color} style={{ backgroundColor: color, color: '#FFF' }}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Line Style</label>
          <select
            value={filters.lineStyle}
            onChange={(e) => setFilters(prev => ({ ...prev, lineStyle: e.target.value as 'solid' | 'dashed' | 'dotted' }))}
            className="block w-full text-sm border-[#E5E7EB] rounded-md bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
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
            className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded-md hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Curve
          </button>
        </div>
      </div>
    </div>
  );
};

interface CurveStatCardProps {
  data: (CurveData & { style?: { color: string; lineStyle: 'solid' | 'dashed' | 'dotted' } })[];
  granularity: Granularity;
}

const CurveStatCard: React.FC<CurveStatCardProps> = ({ data, granularity }) => {
  const groupedStats = React.useMemo(() => {
    return data.reduce((acc, point) => {
      if (!acc[point.curveId]) {
        acc[point.curveId] = {
          curveId: point.curveId,
          curve_creator: point.curve_creator,
          mark_case: point.mark_case,
          mark_date: point.mark_date,
          style: point.style,
          values: [],
        };
      }
      acc[point.curveId].values.push(point.value);
      return acc;
    }, {} as Record<number, {
      curveId: number;
      curve_creator: string;
      mark_case: string;
      mark_date: string;
      style?: { color: string; lineStyle: 'solid' | 'dashed' | 'dotted' };
      values: number[];
    }>);
  }, [data]);

  const calculateAverage = (values: number[]) => {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
      {Object.values(groupedStats).map(stat => (
        <div 
          key={stat.curveId}
          className="bg-white rounded-lg p-3 border-l-4 transition-all duration-200 hover:-translate-y-1"
          style={{ 
            borderLeftColor: stat.style?.color || '#3B82F6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-sm font-semibold text-[#1F2937] truncate">{stat.mark_case}</h3>
              <span className="text-xs text-[#6B7280] ml-1 shrink-0 font-mono">{formatDate(stat.mark_date)}</span>
            </div>
            <p className="text-xs text-[#6B7280] truncate mb-2">{stat.curve_creator}</p>
            <p className="text-xl font-bold text-[#111827] font-mono">
              ${calculateAverage(stat.values).toFixed(2)}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {granularity === 'monthly' ? '$/kw-mn' : '$/kw-yr'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function CurveViewer() {
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
          // Split into monthly and annual
          const monthly = data.filter(curve => curve.granularity?.toLowerCase() === 'monthly');
          const annual = data.filter(curve => curve.granularity?.toLowerCase() === 'annual');
          setMonthlyDefinitions(monthly);
          setAnnualDefinitions(annual);
        })
        .catch(console.error);
    }
  }, [location]);

  const handleMonthlyCurveToggle = (curveId: number, style?: CurveStyle) => {
    if (style) {
      setCurveStyles(prev => ({ ...prev, [curveId]: style }));
    }
    setMonthlyCurves(prev => {
      const newCurves = prev.includes(curveId) 
        ? prev.filter(id => id !== curveId)
        : [...prev, curveId];
      return newCurves;
    });
  };

  const handleAnnualCurveToggle = (curveId: number, style?: CurveStyle) => {
    if (style) {
      setCurveStyles(prev => ({ ...prev, [curveId]: style }));
    }
    setAnnualCurves(prev => {
      const newCurves = prev.includes(curveId) 
        ? prev.filter(id => id !== curveId)
        : [...prev, curveId];
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
        alert('No data available to download.');
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
      
      // Clean up the URL object
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Failed to download graph data:', err);
      alert('Failed to download data. Please try again later.');
    }
  };

  if (!mounted) {
    return null;
  }

  if (error) {
    return (
      <div className="text-[#DC2626] p-4 bg-[#FEF2F2] rounded-lg border border-[#EF4444]">
        <span className="font-semibold">Error:</span> {error}
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
      {/* Location Selector Card - Design System */}
      <div className="bg-white rounded-lg p-6 accent-border-blue" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-[#2A2A2A] whitespace-nowrap" style={{ letterSpacing: '-0.01em' }}>Select a Location</h1>
          <LocationSelector 
            value={location} 
            onChange={setLocation}
            locations={locations}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="animate-pulse">
            <div className="h-4 bg-[#E5E7EB] rounded w-3/4 mx-auto"></div>
            <div className="space-y-3 mt-4">
              <div className="h-4 bg-[#E5E7EB] rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-[#E5E7EB] rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Monthly Revenue Chart - Design System ChartCard */}
          <div className="bg-white rounded-lg overflow-hidden accent-border-blue" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-[#1F2937]">Monthly Revenue ($/kw-month) - Front 24 Months</h2>
                <button
                  onClick={() => handleDownloadGraphData(monthlyDataWithStyles, 'monthly')}
                  disabled={monthlyDataWithStyles.length === 0}
                  className="px-3 py-1 text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Download Graph Data
                </button>
              </div>
              <p className="text-sm text-[#6B7280]">Compare monthly revenue curves across different scenarios</p>
            </div>
            <div className="px-6 pb-6">
            {monthlyDataWithStyles.length > 0 && (
              <CurveStatCard data={monthlyDataWithStyles} granularity="monthly" />
            )}
            <DualChartSystem 
              data={monthlyDataWithStyles} 
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
          </div>

          {/* Annual Revenue Chart - Design System ChartCard */}
          <div className="bg-white rounded-lg overflow-hidden accent-border-green" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-[#1F2937]">Annual Revenue ($/kw-year) - Front 10 Years</h2>
                <button
                  onClick={() => handleDownloadGraphData(annualDataWithStyles, 'annual')}
                  disabled={annualDataWithStyles.length === 0}
                  className="px-3 py-1 text-sm text-[#10B981] hover:text-[#059669] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Download Graph Data
                </button>
              </div>
              <p className="text-sm text-[#6B7280]">Compare annual revenue curves across different scenarios</p>
            </div>
            <div className="px-6 pb-6">
              {annualDataWithStyles.length > 0 && (
                <CurveStatCard data={annualDataWithStyles} granularity="annual" />
              )}
              <DualChartSystem 
                data={annualDataWithStyles}
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
        </div>
      )}
    </div>
  );
} 