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

interface CurveSelectionProps {
  location: string;
  selectedCurves: number[];
  onCurveToggle: (curveId: number) => void;
  granularity: Granularity;
  availableCurves: CurveDefinition[];
}

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
    curve_creator: ''
  });

  // Get unique values for dropdowns from all available curves
  const uniqueValues = React.useMemo(() => {
    console.log('Getting unique values from curves:', availableCurves);
    return availableCurves.reduce((acc, curve) => {
      if (!acc.mark_cases.includes(curve.mark_case)) acc.mark_cases.push(curve.mark_case);
      if (!acc.curve_creators.includes(curve.curve_creator)) {
        console.log('Adding curve creator:', curve.curve_creator);
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

  // Filter available curves based on selected filters
  const filteredCurves = availableCurves.filter(curve => {
    const matches = (!filters.mark_case || curve.mark_case === filters.mark_case) &&
           (!filters.mark_date || curve.mark_date?.toString() === filters.mark_date) &&
           (!filters.curve_creator || curve.curve_creator === filters.curve_creator);
    return matches;
  });

  // Handle adding a curve when filters are set
  const handleAddCurve = () => {
    console.log('Handling add curve with filters:', filters);
    console.log('Filtered curves:', filteredCurves);
    const matchingCurves = filteredCurves.filter(curve => !selectedCurves.includes(curve.curve_id));
    console.log('Matching curves not already selected:', matchingCurves);
    if (matchingCurves.length > 0) {
      console.log('Adding curve:', matchingCurves[0]);
      onCurveToggle(matchingCurves[0].curve_id);
      setFilters({ mark_case: '', mark_date: '', curve_creator: '' });
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Case</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {availableCurves
                .filter(curve => selectedCurves.includes(curve.curve_id))
                .map(curve => (
                  <tr key={curve.curve_id} className="hover:bg-gray-50">
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
      <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
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
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [monthlyDefinitions, setMonthlyDefinitions] = useState<CurveDefinition[]>([]);
  const [annualDefinitions, setAnnualDefinitions] = useState<CurveDefinition[]>([]);
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

  const handleMonthlyCurveToggle = (curveId: number) => {
    console.log('Toggling monthly curve:', curveId);
    console.log('Current monthly curves:', monthlyCurves);
    setMonthlyCurves(prev => {
      const newCurves = prev.includes(curveId) 
        ? prev.filter(id => id !== curveId)
        : [...prev, curveId];
      console.log('New monthly curves:', newCurves);
      return newCurves;
    });
  };

  const handleAnnualCurveToggle = (curveId: number) => {
    console.log('Toggling annual curve:', curveId);
    console.log('Current annual curves:', annualCurves);
    setAnnualCurves(prev => {
      const newCurves = prev.includes(curveId) 
        ? prev.filter(id => id !== curveId)
        : [...prev, curveId];
      console.log('New annual curves:', newCurves);
      return newCurves;
    });
  };

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
    <div className="max-w-[1920px] mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Price Forecasts</h1>
        <LocationSelector 
          value={location} 
          onChange={setLocation}
          locations={locations}
        />
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
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Monthly Prices</h2>
            <DualChartSystem 
              data={monthlyData} 
              title="Monthly Prices"
              granularity="monthly"
              height={500}
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
            <h2 className="text-xl font-semibold mb-4">Annual Prices</h2>
            <DualChartSystem 
              data={annualData}
              title="Annual Prices"
              granularity="annual"
              height={500}
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