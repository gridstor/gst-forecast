import React, { useState, useEffect } from 'react';
import DualRangeChart from './DualRangeChart';

interface Location {
  id: string;
  name: string;
  market: string;
  location: string;
}

interface CurveDefinition {
  definitionId: number;
  curveName: string;
  market: string;
  location: string;
  batteryDuration: string;
  units: string;
  latestInstance: {
    instanceId: number;
    instanceVersion: string;
    status: string;
    createdAt: string;
    createdBy: string;
    curveTypes: string[];
    commodities: string[];
    scenarios: string[];
    granularity: string;
  } | null;
}

interface CurveDataPoint {
  timestamp: string;
  value: number;
  curveType: string;
  commodity: string;
  scenario: string;
  instanceId: number;
  curveName: string;
  units: string;
}

interface TimeFilter {
  startDate: string | null;
  endDate: string | null;
  preset: string;
}

export default function CurveViewerEnhanced() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [curveDefinitions, setCurveDefinitions] = useState<CurveDefinition[]>([]);
  const [selectedCurves, setSelectedCurves] = useState<number[]>([]);
  const [curveData, setCurveData] = useState<CurveDataPoint[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ startDate: null, endDate: null, preset: 'all' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Update available locations when market changes
  useEffect(() => {
    if (selectedMarket && locations.length > 0) {
      const locsForMarket = locations
        .filter(loc => loc.market === selectedMarket)
        .map(loc => loc.location)
        .sort();
      setAvailableLocations(locsForMarket);
      
      // Auto-select first location in market
      if (locsForMarket.length > 0) {
        const firstLoc = locations.find(
          loc => loc.market === selectedMarket && loc.location === locsForMarket[0]
        );
        if (firstLoc) {
          setSelectedLocation(firstLoc);
        }
      }
    }
  }, [selectedMarket, locations]);

  // Fetch curve definitions when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchCurveDefinitions(selectedLocation.market, selectedLocation.location);
    }
  }, [selectedLocation]);

  // Fetch curve data when selected curves change
  useEffect(() => {
    if (selectedCurves.length > 0) {
      fetchCurveData(selectedCurves);
    } else {
      setCurveData([]);
    }
  }, [selectedCurves]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/curves/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
      
      // Extract unique markets
      const uniqueMarkets = [...new Set(data.map((loc: Location) => loc.market))].sort();
      setMarkets(uniqueMarkets);
      
      // Set first market and location as default
      if (uniqueMarkets.length > 0) {
        setSelectedMarket(uniqueMarkets[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    }
  };

  const fetchCurveDefinitions = async (market: string, location: string) => {
    setLoading(true);
    try {
      console.log('Fetching curves for:', { market, location });
      const response = await fetch(
        `/api/curves/by-location-enhanced?market=${encodeURIComponent(market)}&location=${encodeURIComponent(location)}`
      );
      if (!response.ok) throw new Error('Failed to fetch curve definitions');
      const data = await response.json();
      console.log('Curve definitions loaded:', data.length);
      setCurveDefinitions(data);
      
      // Auto-select Oct25 instance (or first with "Oct" in version)
      const oct25 = data.find((d: CurveDefinition) => 
        d.latestInstance && (
          d.latestInstance.instanceVersion?.includes('Oct') || 
          d.latestInstance.instanceVersion?.includes('25') ||
          d.latestInstance.instanceVersion?.includes('OCT')
        )
      );
      
      if (oct25 && oct25.latestInstance) {
        console.log('Auto-selecting Oct25:', oct25.latestInstance.instanceVersion);
        setSelectedCurves([oct25.latestInstance.instanceId]);
      } else {
        // Fallback to first curve with an instance
        const firstCurveWithInstance = data.find((d: CurveDefinition) => d.latestInstance);
        if (firstCurveWithInstance && firstCurveWithInstance.latestInstance) {
          console.log('Auto-selecting first curve:', firstCurveWithInstance.latestInstance.instanceVersion);
          setSelectedCurves([firstCurveWithInstance.latestInstance.instanceId]);
        }
      }
    } catch (err) {
      console.error('Error fetching curve definitions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch curves');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurveData = async (instanceIds: number[]) => {
    setLoading(true);
    try {
      console.log('Fetching data for instance IDs:', instanceIds);
      const response = await fetch(
        `/api/curves/data-with-pvalues?instanceIds=${instanceIds.join(',')}`
      );
      if (!response.ok) throw new Error('Failed to fetch curve data');
      const data = await response.json();
      console.log('Curve data fetched:', data.length, 'points');
      if (data.length > 0) {
        console.log('Sample data point:', data[0]);
      }
      setCurveData(data);
    } catch (err) {
      console.error('Error fetching curve data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch curve data');
    } finally {
      setLoading(false);
    }
  };

  const toggleCurve = (instanceId: number) => {
    setSelectedCurves(prev => 
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  const selectAllCurves = (granularity: string) => {
    const curves = curvesByGranularity[granularity] || [];
    const instanceIds = curves
      .filter(c => c.latestInstance)
      .map(c => c.latestInstance!.instanceId);
    setSelectedCurves(prev => [...new Set([...prev, ...instanceIds])]);
  };

  const clearAllCurves = (granularity: string) => {
    const curves = curvesByGranularity[granularity] || [];
    const instanceIds = curves
      .filter(c => c.latestInstance)
      .map(c => c.latestInstance!.instanceId);
    setSelectedCurves(prev => prev.filter(id => !instanceIds.includes(id)));
  };

  const isCurveFresh = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  };

  const getSelectedCurveInfo = () => {
    const selected = curveDefinitions.filter(curve => 
      curve.latestInstance && selectedCurves.includes(curve.latestInstance.instanceId)
    );
    return selected;
  };

  const handleMarketChange = (market: string) => {
    setSelectedMarket(market);
  };

  const handleLocationChange = (locationName: string) => {
    const loc = locations.find(
      l => l.market === selectedMarket && l.location === locationName
    );
    if (loc) {
      setSelectedLocation(loc);
    }
  };

  const handleTimePresetChange = (preset: string) => {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (preset) {
      case '1y':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        break;
      case '3y':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        break;
      case '5y':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        break;
      case '10y':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        break;
      case 'custom':
        // Keep current dates
        startDate = timeFilter.startDate;
        endDate = timeFilter.endDate;
        break;
      default: // 'all'
        startDate = null;
        endDate = null;
    }

    setTimeFilter({ startDate, endDate, preset });
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    setTimeFilter(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: value,
      preset: 'custom'
    }));
  };

  // Group curves by granularity
  const curvesByGranularity = React.useMemo(() => {
    return curveDefinitions.reduce((acc, curve) => {
      const gran = curve.latestInstance?.granularity?.toUpperCase() || 'MONTHLY';
      if (!acc[gran]) acc[gran] = [];
      acc[gran].push(curve);
      return acc;
    }, {} as Record<string, CurveDefinition[]>);
  }, [curveDefinitions]);

  if (error) {
    return (
      <div className="text-[#DC2626] p-4 bg-[#FEF2F2] rounded-lg border border-[#EF4444]">
        <span className="font-semibold">Error:</span> {error}
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto space-y-6">
      {/* Header and Location Selector */}
      <div className="bg-white rounded-lg p-6 accent-border-blue" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2A2A2A] mb-2" style={{ letterSpacing: '-0.01em' }}>
            GridStor Revenue Forecast Grapher
          </h1>
          <p className="text-base text-[#6B7280]">
            View and compare revenue projections with confidence intervals. Default shows latest GridStor curve (Oct25).
          </p>
        </div>
        
        {/* Location Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">Select Market:</label>
            <select
              value={selectedMarket}
              onChange={(e) => handleMarketChange(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
            >
              <option value="">Select a market...</option>
              {markets.map(market => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">Select Node/Location:</label>
            <select
              value={selectedLocation?.location || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              disabled={!selectedMarket}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a location...</option>
              {availableLocations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Period Filter */}
        <div className="border-t border-[#E5E7EB] pt-4">
          <label className="block text-sm font-medium text-[#6B7280] mb-3">Time Period:</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Preset Range:</label>
              <select
                value={timeFilter.preset}
                onChange={(e) => handleTimePresetChange(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md bg-white text-[#111827] text-sm focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
              >
                <option value="all">All Data</option>
                <option value="1y">Next 1 Year</option>
                <option value="3y">Next 3 Years</option>
                <option value="5y">Next 5 Years</option>
                <option value="10y">Next 10 Years</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Start Date:</label>
              <input
                type="date"
                value={timeFilter.startDate || ''}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                disabled={timeFilter.preset !== 'custom'}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md bg-white text-[#111827] text-sm focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">End Date:</label>
              <input
                type="date"
                value={timeFilter.endDate || ''}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                disabled={timeFilter.preset !== 'custom'}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md bg-white text-[#111827] text-sm focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Available Curves Summary */}
      {!loading && curveDefinitions.length > 0 && (
        <div className="bg-white rounded-lg p-6 accent-border-purple" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-[#1F2937] mb-1">
                Available Curves for {selectedLocation?.name || 'this location'}
              </h2>
              <p className="text-sm text-[#6B7280]">
                {curveDefinitions.length} curve{curveDefinitions.length !== 1 ? 's' : ''} available • 
                {selectedCurves.length > 0 ? ` ${selectedCurves.length} selected` : ' None selected'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCurves([])}
                disabled={selectedCurves.length === 0}
                className="px-4 py-2 text-sm font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Selected Curves Display */}
          {selectedCurves.length > 0 && (
            <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#0369A1] mb-3">
                Currently Graphing ({selectedCurves.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {getSelectedCurveInfo().map((curve) => (
                  <div
                    key={curve.definitionId}
                    className="inline-flex items-center gap-2 bg-white border border-[#BAE6FD] rounded-lg px-3 py-2 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111827]">
                          {curve.curveName}
                        </span>
                        {curve.latestInstance && isCurveFresh(curve.latestInstance.createdAt) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#10B981] text-white">
                            FRESH
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-0.5">
                        {curve.latestInstance?.instanceVersion} • {curve.batteryDuration}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCurve(curve.latestInstance!.instanceId)}
                      className="text-[#DC2626] hover:text-[#991B1B] hover:bg-[#FEE2E2] rounded p-1 transition-colors"
                      title="Remove from graph"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 bg-white rounded-lg" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="animate-pulse">
            <div className="h-4 bg-[#E5E7EB] rounded w-3/4 mx-auto"></div>
            <div className="space-y-3 mt-4">
              <div className="h-4 bg-[#E5E7EB] rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-[#E5E7EB] rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        </div>
      )}

      {!loading && curveData.length > 0 && (
        <div className="bg-white rounded-lg overflow-hidden accent-border-blue" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#1F2937] mb-2">
              GridStor Revenue Forecast
            </h2>
            <p className="text-sm text-[#6B7280] mb-4">
              P25-P75 interquartile range (gray) • P5-P95 confidence interval (cyan) • P50 median forecast (blue line)
            </p>
            <DualRangeChart 
              data={curveData} 
              color="#34D5ED" 
              startDate={timeFilter.startDate}
              endDate={timeFilter.endDate}
            />
          </div>
        </div>
      )}
      
      {!loading && curveData.length === 0 && selectedCurves.length > 0 && (
        <div className="bg-white rounded-lg p-12 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p className="text-[#6B7280]">No data available for selected curves. Upload data for these instances.</p>
        </div>
      )}

      {/* Curve Selection by Granularity */}
      {Object.entries(curvesByGranularity).map(([granularity, curves]) => {
        const curvesWithInstances = curves.filter(c => c.latestInstance);
        const selectedInGranularity = curvesWithInstances.filter(c => 
          selectedCurves.includes(c.latestInstance!.instanceId)
        ).length;
        
        return (
          <div 
            key={granularity}
            className="bg-white rounded-lg overflow-hidden accent-border-purple" 
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#1F2937]">
                    {granularity} Curves
                  </h2>
                  <p className="text-sm text-[#6B7280] mt-1">
                    {curvesWithInstances.length} available • {selectedInGranularity} selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAllCurves(granularity)}
                    className="px-3 py-1.5 text-xs font-medium text-[#3B82F6] bg-[#EFF6FF] border border-[#DBEAFE] rounded-md hover:bg-[#DBEAFE] transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => clearAllCurves(granularity)}
                    disabled={selectedInGranularity === 0}
                    className="px-3 py-1.5 text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider w-16">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Curve Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Latest Version
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Battery
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Types / Commodities / Scenarios
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E7EB]">
                  {curves.map(curve => {
                    const instanceId = curve.latestInstance?.instanceId;
                    const isSelected = instanceId && selectedCurves.includes(instanceId);
                    const isFresh = curve.latestInstance && isCurveFresh(curve.latestInstance.createdAt);
                    
                    return (
                      <tr 
                        key={curve.definitionId}
                        onClick={() => curve.latestInstance && toggleCurve(curve.latestInstance.instanceId)}
                        className={`transition-colors cursor-pointer ${
                          !curve.latestInstance ? 'opacity-50 cursor-not-allowed' : 
                          isSelected ? 'bg-[#EFF6FF] hover:bg-[#DBEAFE]' : 'hover:bg-[#F9FAFB]'
                        }`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {curve.latestInstance && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCurve(curve.latestInstance!.instanceId)}
                              className="w-5 h-5 text-[#3B82F6] border-[#D1D5DB] rounded focus:ring-[#3B82F6] focus:ring-2 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#111827] font-medium">
                              {curve.curveName}
                            </span>
                            {isFresh && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#10B981] text-white">
                                FRESH
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[#111827] font-mono font-medium">
                            {curve.latestInstance?.instanceVersion || 'No instance'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {curve.latestInstance && (
                            <div>
                              <div className="text-sm text-[#111827]">
                                {new Date(curve.latestInstance.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </div>
                              <div className="text-xs text-[#6B7280]">
                                by {curve.latestInstance.createdBy || 'Unknown'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B7280]">
                          {curve.batteryDuration}
                        </td>
                        <td className="px-4 py-3">
                          {curve.latestInstance && (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {(curve.latestInstance.curveTypes || []).map((t, i) => (
                                  <span key={i} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{t}</span>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(curve.latestInstance.commodities || []).map((c, i) => (
                                  <span key={i} className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">{c}</span>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(curve.latestInstance.scenarios || []).map((s, i) => (
                                  <span key={i} className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {curve.latestInstance && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                              curve.latestInstance.status === 'ACTIVE' 
                                ? 'bg-[#ECFDF5] text-[#059669]' 
                                : 'bg-[#F9FAFB] text-[#6B7280]'
                            }`}>
                              {curve.latestInstance.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        );
      })}

      {!loading && curveDefinitions.length === 0 && selectedLocation && (
        <div className="bg-white rounded-lg p-12 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p className="text-[#6B7280]">No curves available for this location.</p>
        </div>
      )}
    </div>
  );
}

