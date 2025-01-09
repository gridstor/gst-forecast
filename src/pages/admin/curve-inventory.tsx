import React, { useState, useEffect } from 'react';
import { LocationSelector } from '../../components/common/LocationSelector';
import type { CurveDefinition, LocationOption } from '../../lib/types';
import { fetchCurvesByLocation, fetchLocations, setDefaultCurve, fetchCurveData } from '../../lib/api-client';

const DEFAULT_LOCATION = 'all';

export const CurveInventory: React.FC = () => {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>(DEFAULT_LOCATION);
  const [curves, setCurves] = useState<CurveDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [updatingCurve, setUpdatingCurve] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Sort function
  const sortedCurves = React.useMemo(() => {
    let sortedData = [...curves];
    if (sortConfig) {
      sortedData.sort((a: any, b: any) => {
        if (sortConfig.key === 'mark_date') {
          return sortConfig.direction === 'asc' 
            ? new Date(a[sortConfig.key]).getTime() - new Date(b[sortConfig.key]).getTime()
            : new Date(b[sortConfig.key]).getTime() - new Date(a[sortConfig.key]).getTime();
        }
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
  }, [curves, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return '▲▼';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  // Initial load of both locations and curves
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setLoadingLocations(true);
      setError(null);

      try {
        // First fetch locations
        console.log('Fetching locations...');
        const locationsData = await fetchLocations();
        console.log('Locations received:', locationsData);
        
        if (Array.isArray(locationsData) && locationsData.length > 0) {
          setLocations(locationsData);
          
          // Fetch curves for all locations
          console.log('Fetching initial curves for all locations');
          const allCurves = await Promise.all(
            locationsData.map(loc => fetchCurvesByLocation(loc.id))
          );
          setCurves(allCurves.flat());
        } else {
          console.warn('No locations received from API');
          setError('No locations available');
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize data');
      } finally {
        setLoading(false);
        setLoadingLocations(false);
      }
    };

    initializeData();
  }, []); // Only run on mount

  const refreshCurves = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching curves for location:', selectedLocation);
      if (selectedLocation === 'all') {
        const allCurves = await Promise.all(
          locations.map(loc => fetchCurvesByLocation(loc.id))
        );
        const flattenedCurves = allCurves.flat();
        console.log('All curves data:', flattenedCurves);
        console.log('Sample curve details:', flattenedCurves[0]);
        setCurves(flattenedCurves);
      } else {
        const data = await fetchCurvesByLocation(selectedLocation);
        console.log('Location specific curves:', data);
        if (Array.isArray(data)) {
          console.log('Sample curve details:', data[0]);
          setCurves(data);
        } else {
          console.warn('Invalid curves data received:', data);
          setError('Invalid curves data received');
        }
      }
    } catch (err) {
      console.error('Error refreshing curves:', err);
      setError('Failed to refresh curves');
    } finally {
      setLoading(false);
    }
  };

  // This effect handles location changes after initial load
  useEffect(() => {
    if (selectedLocation && selectedLocation !== DEFAULT_LOCATION) {
      refreshCurves();
    }
  }, [selectedLocation]);

  const handleLocationChange = async (location: string) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
    setLoading(true);
    setCurves([]);  // Clear existing curves
    
    try {
      if (location === 'all') {
        // Fetch curves for all locations
        const allCurves = await Promise.all(
          locations.map(loc => fetchCurvesByLocation(loc.id))
        );
        setCurves(allCurves.flat());
      } else {
        const data = await fetchCurvesByLocation(location);
        if (Array.isArray(data)) {
          setCurves(data);
        }
      }
    } catch (err) {
      console.error('Error fetching curves:', err);
      setError('Failed to fetch curves');
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultToggle = async (curve: CurveDefinition, isDefault: boolean) => {
    try {
      setError(null);
      setUpdatingCurve(curve.curve_id);
      console.log('Toggling default status:', { curveId: curve.curve_id, isDefault });
      
      // Optimistically update the UI
      setCurves(prevCurves => 
        prevCurves.map(c => 
          c.curve_id === curve.curve_id 
            ? { ...c, is_default: isDefault }
            : c
        )
      );

      const response = await setDefaultCurve(
        curve.curve_id,
        isDefault,
        isDefault ? (curves.filter(c => c.is_default).length + 1) : undefined
      );
      console.log('Toggle response:', response);

      // Refresh to ensure we have the latest state
      await refreshCurves();
    } catch (error) {
      console.error('Failed to update curve:', error);
      setError('Failed to update curve default status');
      // Revert the optimistic update
      await refreshCurves();
    } finally {
      setUpdatingCurve(null);
    }
  };

  const handleDownload = async (curve: CurveDefinition) => {
    try {
      setError(null);
      const data = await fetchCurveData({
        curveIds: [curve.curve_id],
        aggregation: curve.granularity.toLowerCase() as 'monthly' | 'annual'
      });
      
      if (!data || data.length === 0) {
        setError('No data available for this curve');
        return;
      }

      // Convert data to CSV format
      const headers = ['Date', 'Value', 'Location', 'Mark Case', 'Creator'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => [
          new Date(row.date).toLocaleDateString(),
          row.value,
          row.location,
          row.mark_case,
          row.curve_creator
        ].join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `curve_${curve.curve_id}_${curve.mark_case}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download curve:', err);
      setError('Failed to download curve data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Curve Inventory</h1>
          
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {loadingLocations ? (
            <div className="mb-6">Loading locations...</div>
          ) : (
            <div className="flex items-center gap-4">
              <LocationSelector
                value={selectedLocation}
                onChange={handleLocationChange}
                locations={[
                  { id: 'all', name: 'All Locations', market: '', active: true },
                  ...locations
                ]}
              />
              <button
                onClick={refreshCurves}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh
              </button>
            </div>
          )}

          {selectedLocation && (
            <div className="mt-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Default
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('curve_id')}>
                        ID {getSortIndicator('curve_id')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('mark_type')}>
                        Mark Type {getSortIndicator('mark_type')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('mark_case')}>
                        Mark Case {getSortIndicator('mark_case')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('granularity')}>
                        Granularity {getSortIndicator('granularity')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('mark_date')}>
                        Mark Date {getSortIndicator('mark_date')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : sortedCurves.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No curves found for this location
                        </td>
                      </tr>
                    ) : (
                      sortedCurves.map(curve => (
                        <React.Fragment key={curve.curve_id}>
                          <tr 
                            className={`${updatingCurve === curve.curve_id ? 'opacity-50' : ''} hover:bg-gray-50 cursor-pointer`}
                            onClick={() => setExpandedRow(expandedRow === curve.curve_id ? null : curve.curve_id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={curve.is_default}
                                onChange={(e) => handleDefaultToggle(curve, e.target.checked)}
                                disabled={updatingCurve === curve.curve_id}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {curve.curve_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {curve.mark_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {curve.mark_case}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {curve.granularity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(curve.mark_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleDownload(curve)}
                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                              >
                                Download CSV
                              </button>
                            </td>
                          </tr>
                          {expandedRow === curve.curve_id && (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="px-6 py-4">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Location Details</h4>
                                    <p className="text-gray-600">Market: {curve.market}</p>
                                    <p className="text-gray-600">Location: {curve.location}</p>
                                    <p className="text-gray-600">Value Type: {curve.value_type || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Mark Details</h4>
                                    <p className="text-gray-600">Fundamentals: {curve.mark_fundamentals_desc || 'N/A'}</p>
                                    <p className="text-gray-600">Model Type: {curve.mark_model_type_desc || 'N/A'}</p>
                                    <p className="text-gray-600">Dispatch Optimization: {curve.mark_dispatch_optimization_desc || 'N/A'}</p>
                                    <p className="text-gray-600">GridStor Purpose: {curve.gridstor_purpose || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Curve Details</h4>
                                    <p className="text-gray-600">Created: {new Date(curve.created_at).toLocaleString()}</p>
                                    <p className="text-gray-600">Start Date: {curve.curve_start_date ? new Date(curve.curve_start_date).toLocaleDateString() : 'N/A'}</p>
                                    <p className="text-gray-600">End Date: {curve.curve_end_date ? new Date(curve.curve_end_date).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurveInventory; 