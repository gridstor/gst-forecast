import React, { useState, useEffect } from 'react';
import MultiCurveChart from './MultiCurveChart';

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

interface SelectedCurveInfo {
  instanceId: number;
  curveName: string;
  instanceVersion: string;
  color: string;
  isPrimary: boolean; // True for GridStor P-value curves
}

export default function CurveViewerEnhanced() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [curveDefinitions, setCurveDefinitions] = useState<CurveDefinition[]>([]);
  const [allInstances, setAllInstances] = useState<any[]>([]); // ALL instances for location
  const [selectedCurves, setSelectedCurves] = useState<SelectedCurveInfo[]>([]);
  const [curveData, setCurveData] = useState<CurveDataPoint[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ startDate: null, endDate: null, preset: 'all' });
  const [summaryPeriod, setSummaryPeriod] = useState<string>('5y'); // New: Flexible summary periods
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Color palette for overlay curves
  const overlayColors = ['#FF6B35', '#F77F00', '#FCBF49', '#06B6D4', '#8B5CF6', '#EC4899'];

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

  // Fetch curve definitions and ALL instances when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchCurveDefinitions(selectedLocation.market, selectedLocation.location);
      fetchAllInstancesForLocation(selectedLocation.market, selectedLocation.location);
    }
  }, [selectedLocation]);

  // Fetch curve data when selected curves change
  useEffect(() => {
    if (selectedCurves.length > 0) {
      const instanceIds = selectedCurves.map(c => c.instanceId);
      fetchCurveData(instanceIds);
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
      
      // Auto-select the best GridStor curve with P-values
      // Priority: GridStor + P-values > Any + P-values > GridStor Base > Any Base
      
      let bestCurve: CurveDefinition | null = null;
      let bestScore = -1;
      
      for (const d of data) {
        if (!d.latestInstance) continue;
        
        const isGridStor = d.latestInstance.createdBy?.toLowerCase().includes('gridstor');
        const hasPValues = d.latestInstance.scenarios?.some(s => 
          s.includes('P5') || s.includes('P05') || s.includes('P95')
        );
        
        // Scoring: GridStor+Pvalues=4, Pvalues=3, GridStor=2, Other=1
        let score = 1;
        if (isGridStor && hasPValues) score = 4;
        else if (hasPValues) score = 3;
        else if (isGridStor) score = 2;
        
        if (score > bestScore) {
          bestScore = score;
          bestCurve = d;
        }
      }
      
      if (bestCurve && bestCurve.latestInstance) {
        const hasPValues = bestCurve.latestInstance.scenarios?.some(s => 
          s.includes('P5') || s.includes('P05') || s.includes('P95')
        );
        
        console.log('Auto-selecting best curve:', bestCurve.latestInstance.instanceVersion, 'Score:', bestScore);
        setSelectedCurves([{
          instanceId: bestCurve.latestInstance.instanceId,
          curveName: bestCurve.curveName,
          instanceVersion: bestCurve.latestInstance.instanceVersion,
          color: '#3B82F6', // Blue for primary
          isPrimary: true
        }]);
        
        if (!hasPValues) {
          console.warn('⚠️ Selected curve does not have P-values (P5-P95). Graph may show limited data.');
        }
      }
    } catch (err) {
      console.error('Error fetching curve definitions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch curves');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllInstancesForLocation = async (market: string, location: string) => {
    try {
      const response = await fetch(
        `/api/curves/all-instances-for-location?market=${encodeURIComponent(market)}&location=${encodeURIComponent(location)}`
      );
      if (!response.ok) throw new Error('Failed to fetch all instances');
      const data = await response.json();
      console.log('All instances for location:', data.instances.length);
      setAllInstances(data.instances || []);
    } catch (err) {
      console.error('Error fetching all instances:', err);
      // Don't set error - this is optional functionality
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

  const addInstanceAsOverlay = (instance: any) => {
    // Check if already selected
    const alreadySelected = selectedCurves.some(c => c.instanceId === instance.instanceId);
    if (alreadySelected) {
      // Remove it
      setSelectedCurves(prev => prev.filter(c => c.instanceId !== instance.instanceId));
      return;
    }
    
    // Assign color from overlay palette (skip colors already in use)
    const usedColors = selectedCurves.map(c => c.color);
    const availableColor = overlayColors.find(c => !usedColors.includes(c)) || overlayColors[0];
    
    // Determine if this should be primary (GridStor with P-values)
    const isGridStor = instance.createdBy?.toLowerCase().includes('gridstor');
    const isPrimary = isGridStor && instance.hasPValues && selectedCurves.length === 0;
    
    // Add as overlay
    setSelectedCurves(prev => [...prev, {
      instanceId: instance.instanceId,
      curveName: instance.curveName,
      instanceVersion: instance.instanceVersion,
      color: isPrimary ? '#3B82F6' : availableColor,
      isPrimary
    }]);
  };
  
  const addCurveOverlay = (curve: CurveDefinition, instance: any) => {
    addInstanceAsOverlay({ ...instance, curveName: curve.curveName });
  };
  
  const removeCurve = (instanceId: number) => {
    setSelectedCurves(prev => prev.filter(c => c.instanceId !== instanceId));
  };

  const selectAllCurves = (granularity: string) => {
    const curves = curvesByGranularity[granularity] || [];
    const curvesWithInstances = curves.filter(c => c.latestInstance);
    
    // Score each curve to find the best primary
    let bestCurve: CurveDefinition | null = null;
    let bestScore = -1;
    
    curvesWithInstances.forEach(c => {
      const isGridStor = c.latestInstance!.createdBy?.toLowerCase().includes('gridstor');
      const hasPValues = c.latestInstance!.scenarios?.some(s => 
        s.includes('P5') || s.includes('P05') || s.includes('P95')
      );
      
      let score = 1;
      if (isGridStor && hasPValues) score = 4;
      else if (hasPValues) score = 3;
      else if (isGridStor) score = 2;
      
      if (score > bestScore) {
        bestScore = score;
        bestCurve = c;
      }
    });
    
    // Map curves with primary/overlay designation
    let overlayColorIndex = 0;
    const newCurves = curvesWithInstances.map((c) => {
      const isPrimary = bestCurve && c.definitionId === bestCurve.definitionId;
      const color = isPrimary ? '#3B82F6' : overlayColors[overlayColorIndex++ % overlayColors.length];
      
      return {
        instanceId: c.latestInstance!.instanceId,
        curveName: c.curveName,
        instanceVersion: c.latestInstance!.instanceVersion,
        color,
        isPrimary: isPrimary || false
      };
    });
    
    setSelectedCurves(prev => [...prev, ...newCurves]);
  };

  const clearAllCurves = (granularity: string) => {
    const curves = curvesByGranularity[granularity] || [];
    const instanceIds = curves
      .filter(c => c.latestInstance)
      .map(c => c.latestInstance!.instanceId);
    setSelectedCurves(prev => prev.filter(c => !instanceIds.includes(c.instanceId)));
  };

  const isCurveFresh = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  };

  const getSelectedCurveInfo = () => {
    return selectedCurves;
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

          {/* Selected Curves Display - MOVED TO TOP */}
          {selectedCurves.length > 0 && (
            <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#0369A1] mb-3">
                Currently Graphing ({selectedCurves.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCurves.map((curve) => (
                  <div
                    key={curve.instanceId}
                    className="inline-flex items-center gap-2 bg-white border-2 rounded-lg px-3 py-2 shadow-sm"
                    style={{ borderColor: curve.color }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: curve.color }}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111827]">
                          {curve.curveName}
                        </span>
                        {curve.isPrimary && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#10B981] text-white">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-0.5">
                        {curve.instanceVersion}
                      </div>
                    </div>
                    <button
                      onClick={() => removeCurve(curve.instanceId)}
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
        <>
          {/* Total Revenue Graph */}
          <div className="bg-white rounded-lg overflow-hidden accent-border-blue" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-[#1F2937]">
                  Total Revenue Forecast
                </h2>
                <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
                  Download Data
                </button>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                Primary curve shows P5-P95 bands • Overlays show as colored lines for comparison
              </p>
              <MultiCurveChart 
                data={curveData} 
                selectedCurves={selectedCurves}
                startDate={timeFilter.startDate}
                endDate={timeFilter.endDate}
                commodity="Total Revenue"
              />
            </div>
          </div>

          {/* EA Revenue Graph */}
          <div className="bg-white rounded-lg overflow-hidden accent-border-green" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-[#1F2937]">
                  Energy Arbitrage (EA) Revenue
                </h2>
                <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
                  Download Data
                </button>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                Energy arbitrage revenue breakdown from selected curves
              </p>
              <MultiCurveChart 
                data={curveData} 
                selectedCurves={selectedCurves}
                startDate={timeFilter.startDate}
                endDate={timeFilter.endDate}
                commodity="EA Revenue"
              />
            </div>
          </div>

          {/* AS Revenue Graph */}
          <div className="bg-white rounded-lg overflow-hidden accent-border-purple" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-[#1F2937]">
                  Ancillary Services (AS) Revenue
                </h2>
                <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
                  Download Data
                </button>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                Ancillary services revenue breakdown from selected curves
              </p>
              <MultiCurveChart 
                data={curveData} 
                selectedCurves={selectedCurves}
                startDate={timeFilter.startDate}
                endDate={timeFilter.endDate}
                commodity="AS Revenue"
              />
            </div>
          </div>
        </>
      )}
      
      {!loading && curveData.length === 0 && selectedCurves.length > 0 && (
        <div className="bg-white rounded-lg p-12 text-center border-l-4 border-orange-500" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <svg className="mx-auto h-12 w-12 text-orange-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h3 className="text-lg font-semibold text-[#2A2A2A] mb-2">No Graph Data Available</h3>
          <p className="text-[#6B7280] mb-4">
            The selected curve has no data in the database, or it doesn't have P-values (P5-P95) needed for confidence bands.
          </p>
          <div className="text-sm text-[#6B7280] bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
            <strong>Selected:</strong> {selectedCurves.map(c => c.instanceVersion).join(', ')}
            <div className="mt-2 text-xs">Try selecting a different curve with P-values, or upload data for this instance.</div>
          </div>
        </div>
      )}

      {/* Add Curve Overlays - ALL instances for comparison */}
      {!loading && allInstances.length > 0 && (
        <div className="bg-white rounded-lg overflow-hidden accent-border-blue" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#1F2937] mb-1">
                Add Curve Overlays for Comparison
              </h2>
              <p className="text-sm text-[#6B7280]">
                Click any curve to overlay it on the graph • Primary curve shows P-value bands • Overlays show as lines
              </p>
            </div>
            
            <div className="space-y-2">
              {allInstances.map((inst, idx) => {
                const isSelected = selectedCurves.some(sc => sc.instanceId === inst.instanceId);
                const selectedInfo = selectedCurves.find(sc => sc.instanceId === inst.instanceId);
                
                return (
                  <div
                    key={inst.instanceId}
                    onClick={() => addInstanceAsOverlay(inst)}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-300 shadow-sm' 
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: selectedInfo?.color, borderColor: selectedInfo?.color }}></div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{inst.instanceVersion}</span>
                          {inst.createdBy?.toLowerCase().includes('gridstor') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                              GridStor
                            </span>
                          )}
                          {inst.hasPValues && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                              📊 P-values
                            </span>
                          )}
                          {selectedInfo?.isPrimary && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-600 text-white">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="font-medium">{inst.curveName}</span>
                          <span>•</span>
                          <span>by {inst.createdBy}</span>
                          <span>•</span>
                          <span className="font-mono">{new Date(inst.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(inst.commodities || []).slice(0, 3).map((c: string, i: number) => (
                            <span key={i} className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">{c}</span>
                          ))}
                          {inst.commodities?.length > 3 && (
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">+{inst.commodities.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <span className="text-blue-600 font-semibold text-sm">✓ Added</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Click to add</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Curve Selection by Granularity - KEEP for other markets/locations */}
      {Object.entries(curvesByGranularity).map(([granularity, curves]) => {
        const curvesWithInstances = curves.filter(c => c.latestInstance);
        const selectedInGranularity = curvesWithInstances.filter(c => 
          selectedCurves.some(sc => sc.instanceId === c.latestInstance!.instanceId)
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
                    const isSelected = instanceId && selectedCurves.some(sc => sc.instanceId === instanceId);
                    const isFresh = curve.latestInstance && isCurveFresh(curve.latestInstance.createdAt);
                    
                    return (
                      <tr 
                        key={curve.definitionId}
                        onClick={() => curve.latestInstance && addCurveOverlay(curve, curve.latestInstance)}
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
                              onChange={() => addCurveOverlay(curve, curve.latestInstance)}
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

