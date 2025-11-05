import React, { useState, useEffect, useMemo } from 'react';
import InteractiveMultiCurveChart from './InteractiveMultiCurveChart';
import CompactCurveSelector from './CompactCurveSelector';
import RevenueProportionChart from './RevenueProportionChart';
import CompactLocationCard from './CompactLocationCard';
import { ChartCard } from './ChartCard';
import { MetricBox } from './MetricBox';

interface Location {
  id: string;
  name: string;
  market: string;
  location: string;
}

interface LocationCardData {
  id: string;
  name: string;
  market: string;
  region: string;
  location: string;
  curves: {
    energyArbitrage: number;
    ancillaryServices: number;
    capacity: number;
  };
  curveSource: string;
  metadata?: {
    dbLocationName?: string;
  };
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
  isPrimary: boolean;
  createdAt?: string;
  createdBy?: string;
}

export default function CurveViewerEnhanced() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationCards, setLocationCards] = useState<LocationCardData[]>([]);
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
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('annual'); // Toggle between monthly and annual view
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Revenue proportion chart controls
  const [selectedScenario, setSelectedScenario] = useState<string>('P50');
  const [groupBy, setGroupBy] = useState<'year' | 'month' | 'quarter'>('year');
  const [showScenarioToggle, setShowScenarioToggle] = useState<boolean>(false);
  
  // Color palette for overlay curves
  const overlayColors = ['#FF6B35', '#F77F00', '#FCBF49', '#06B6D4', '#8B5CF6', '#EC4899'];

  // Fetch locations and location cards on mount
  useEffect(() => {
    fetchLocations();
    fetchLocationCards();
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
      const uniqueMarkets = [...new Set(data.map((loc: Location) => loc.market))] as string[];
      setMarkets(uniqueMarkets.sort());
      
      // Set first market and location as default
      if (uniqueMarkets.length > 0) {
        setSelectedMarket(uniqueMarkets[0] as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    }
  };

  const fetchLocationCards = async () => {
    try {
      const response = await fetch('/api/map-locations');
      if (!response.ok) throw new Error('Failed to fetch location cards');
      const result = await response.json();
      if (result.success && result.data) {
        setLocationCards(result.data);
      }
    } catch (err) {
      console.error('Error fetching location cards:', err);
      // Don't show error - this is optional enhancement
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
        const hasPValues = d.latestInstance.scenarios?.some((s: string) => 
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
        const hasPValues = bestCurve.latestInstance.scenarios?.some((s: string) => 
          s.includes('P5') || s.includes('P05') || s.includes('P95')
        );
        
        console.log('Auto-selecting best curve:', bestCurve.latestInstance.instanceVersion, 'Score:', bestScore);
        setSelectedCurves([{
          instanceId: bestCurve.latestInstance.instanceId,
          curveName: bestCurve.curveName,
          instanceVersion: bestCurve.latestInstance.instanceVersion,
          color: '#3B82F6', // Blue for primary
          isPrimary: true,
          createdAt: bestCurve.latestInstance.createdAt,
          createdBy: bestCurve.latestInstance.createdBy
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
      isPrimary,
      createdAt: instance.createdAt,
      createdBy: instance.createdBy
    }]);
  };
  
  const addCurveOverlay = (curve: CurveDefinition, instance: any) => {
    addInstanceAsOverlay({ ...instance, curveName: curve.curveName });
  };
  
  const removeCurve = (instanceId: number) => {
    setSelectedCurves(prev => prev.filter(c => c.instanceId !== instanceId));
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

  const handleLocationCardClick = (card: LocationCardData) => {
    // Find matching location in locations array
    const loc = locations.find(
      l => l.market === card.market && l.location === card.location
    );
    
    if (loc) {
      // Update market if different
      if (selectedMarket !== card.market) {
        setSelectedMarket(card.market);
      }
      // Set the location
      setSelectedLocation(loc);
    }
  };

  // Categorize locations into hub/node vs location
  const isHubOrNode = (name: string) => {
    const hubKeywords = ['hub', 'node', 'np15', 'sp15', 'zp26', 'north hub', 'south hub', 'houston'];
    return hubKeywords.some(keyword => name.toLowerCase().includes(keyword));
  };

  // Organize location cards into grid structure
  const organizedCards = useMemo(() => {
    const markets = ['CAISO', 'ERCOT', 'SPP'];
    const grid: Record<string, { hubs: LocationCardData[], locations: LocationCardData[] }> = {};
    
    markets.forEach(market => {
      grid[market] = { hubs: [], locations: [] };
    });
    
    locationCards.forEach(card => {
      if (grid[card.market]) {
        if (isHubOrNode(card.name)) {
          grid[card.market].hubs.push(card);
        } else {
          grid[card.market].locations.push(card);
        }
      }
    });
    
    return grid;
  }, [locationCards]);

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

  // Get current vintage (most recent upload date)
  const currentVintageDate = useMemo(() => {
    if (allInstances.length === 0) return null;
    const dates = allInstances.map(i => new Date(i.createdAt).getTime());
    return new Date(Math.max(...dates));
  }, [allInstances]);

  // Identify fresh curves (within 30 days of current vintage)
  const isCurveFreshVintage = (createdAt: string) => {
    if (!currentVintageDate) return false;
    const created = new Date(createdAt);
    const daysDiff = Math.floor((currentVintageDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  };

  // Get available scenarios from curve data
  const availableScenarios = useMemo(() => {
    if (curveData.length === 0) return [];
    const scenarios = new Set<string>();
    curveData.forEach(point => {
      if (point.scenario && point.scenario !== 'Base') {
        scenarios.add(point.scenario);
      }
    });
    // Sort scenarios: P5, P10, P25, P50, P75, P90, P95
    const sorted = Array.from(scenarios).sort((a, b) => {
      const aNum = parseInt(a.replace(/[^0-9]/g, ''));
      const bNum = parseInt(b.replace(/[^0-9]/g, ''));
      return aNum - bNum;
    });
    return sorted;
  }, [curveData]);

  // Calculate comprehensive stats for selected date range (all P-values)
  const rangeStats = useMemo(() => {
    if (curveData.length === 0 || selectedCurves.length === 0) return null;
    
    const primaryCurve = selectedCurves.find(c => c.isPrimary);
    if (!primaryCurve) return null;

    // Calculate stats for each P-value scenario
    const scenarios = ['P5', 'P25', 'P50', 'P75', 'P95'];
    const stats: any = { dataPoints: 0 };
    
    scenarios.forEach(scenario => {
      let filteredData = curveData.filter(
        point => point.instanceId === primaryCurve.instanceId && 
                 point.commodity === 'Total Revenue' &&
                 (point.scenario === scenario || (scenario === 'P5' && point.scenario === 'P05'))
      );

      if (timeFilter.startDate || timeFilter.endDate) {
        const start = timeFilter.startDate ? new Date(timeFilter.startDate).getTime() : -Infinity;
        const end = timeFilter.endDate ? new Date(timeFilter.endDate).getTime() : Infinity;
        filteredData = filteredData.filter(point => {
          const pointDate = new Date(point.timestamp).getTime();
          return pointDate >= start && pointDate <= end;
        });
      }

      if (filteredData.length > 0) {
        const values = filteredData.map(p => p.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        stats[scenario] = { avg, min, max };
        if (scenario === 'P50') {
          stats.dataPoints = filteredData.length;
        }
      }
    });

    // Calculate average across all P-values
    const allAvgs = scenarios.map(s => stats[s]?.avg).filter(v => v != null);
    if (allAvgs.length > 0) {
      stats.overallAvg = allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length;
    }

    return Object.keys(stats).length > 1 ? stats : null;
  }, [curveData, selectedCurves, timeFilter]);

  if (error) {
    return (
      <div className="text-[#DC2626] p-4 bg-[#FEF2F2] rounded-lg border border-[#EF4444]">
        <span className="font-semibold">Error:</span> {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-2">
        {/* Location Cards Grid - 3x2 Layout */}
        {locationCards.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-2.5" style={{ borderLeft: '4px solid #06B6D4' }}>
            <h2 className="text-base font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
              All Markets & Locations
            </h2>
            <p className="text-[10px] text-gray-600 mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
              Click any card to view detailed revenue forecasts • {locationCards.length} locations available
            </p>
            
            {/* Grid Headers */}
            <div className="grid grid-cols-3 gap-1.5 mb-0.5">
              <div className="text-center">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                  CAISO
                </h3>
              </div>
              <div className="text-center">
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                  ERCOT
                </h3>
              </div>
              <div className="text-center">
                <h3 className="text-xs font-bold text-green-600 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                  SPP
                </h3>
              </div>
            </div>
            
            {/* Row 1: Hubs/Nodes */}
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              {['CAISO', 'ERCOT', 'SPP'].map(market => (
                <CompactLocationCard
                  key={`${market}-hubs`}
                  locations={organizedCards[market]?.hubs.map(card => ({
                    name: card.name,
                    market: card.market,
                    location: card.location,
                    energyArbitrage: card.curves.energyArbitrage,
                    ancillaryServices: card.curves.ancillaryServices,
                    capacity: card.curves.capacity,
                    curveSource: card.curveSource,
                    isSelected: selectedLocation?.market === card.market && selectedLocation?.location === card.location,
                    onClick: () => handleLocationCardClick(card)
                  })) || []}
                  market={market}
                  type="hub"
                />
              ))}
            </div>
            
            {/* Row 2: Locations */}
            <div className="grid grid-cols-3 gap-1.5">
              {['CAISO', 'ERCOT', 'SPP'].map(market => (
                <CompactLocationCard
                  key={`${market}-locations`}
                  locations={organizedCards[market]?.locations.map(card => ({
                    name: card.name,
                    market: card.market,
                    location: card.location,
                    energyArbitrage: card.curves.energyArbitrage,
                    ancillaryServices: card.curves.ancillaryServices,
                    capacity: card.curves.capacity,
                    curveSource: card.curveSource,
                    isSelected: selectedLocation?.market === card.market && selectedLocation?.location === card.location,
                    onClick: () => handleLocationCardClick(card)
                  })) || []}
                  market={market}
                  type="location"
                />
              ))}
            </div>
          </div>
        )}

        {/* Selected Location Info or Prompt */}
        {selectedLocation ? (
          <div className="bg-white rounded-lg shadow-sm p-2.5" style={{ borderLeft: '4px solid #06B6D4' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedLocation.location}
                </h1>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedLocation.market}
                  {selectedCurves.length > 0 && selectedCurves[0].createdAt && (
                    <span className="ml-2 text-gray-500">
                      • Latest: {new Date(selectedCurves[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedCurves.length > 0 && (
                  <button
                    onClick={() => setSelectedCurves([])}
                    className="px-2 py-1 text-[10px] font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Clear All Curves
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : locationCards.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow-sm p-4 text-center border-l-4 border-cyan-500">
            <svg 
              className="mx-auto h-8 w-8 text-cyan-500 mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Select a Location to View Forecasts
            </h3>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Click on any location card above to see detailed revenue analysis and forecasts
            </p>
          </div>
        )}


      {loading && (
        <div className="text-center py-4 bg-white rounded-lg shadow-sm">
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded w-48 mx-auto"></div>
            <div className="space-y-2 mt-2">
              <div className="h-2 bg-gray-200 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      )}

        {!loading && curveData.length > 0 && (
          <>
            {/* Compact Dashboard Layout - Graph + Stats Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {/* Main Revenue Graph */}
              <div className="lg:col-span-3">
                <ChartCard
                  title="Total Revenue Forecast"
                  accentColor="cyan"
                  timestamp={selectedCurves[0]?.createdAt ? new Date(selectedCurves[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined}
                  description={`${selectedCurves.filter(c => c.isPrimary).length > 0 ? 'P5-P95 confidence bands • ' : ''}${selectedCurves.length} curve${selectedCurves.length !== 1 ? 's' : ''} displayed`}
                >
                  {/* Compact Controls Row - Figma Design System */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {/* Time Range Quick Select */}
                      <select
                        value={timeFilter.preset}
                        onChange={(e) => handleTimePresetChange(e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <option value="all">All Time</option>
                        <option value="1y">1 Year</option>
                        <option value="3y">3 Years</option>
                        <option value="5y">5 Years</option>
                        <option value="10y">10 Years</option>
                      </select>
                      
                      {/* View Mode Toggle - Figma Blue */}
                      <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button
                          type="button"
                          onClick={() => setViewMode('monthly')}
                          className={`px-3 py-1 text-xs font-medium rounded-l-md border ${
                            viewMode === 'monthly'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          } transition-colors`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('annual')}
                          className={`px-3 py-1 text-xs font-medium rounded-r-md border-t border-r border-b ${
                            viewMode === 'annual'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          } transition-colors`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Annual
                        </button>
                      </div>
                      
                      {/* Compact Curve Selector */}
                      <CompactCurveSelector
                        onCurveSelect={(instance) => addInstanceAsOverlay(instance)}
                        selectedInstanceIds={selectedCurves.map(c => c.instanceId)}
                      />
                    </div>
                    
                    {/* Selected Curves Pills - Compact */}
                    {selectedCurves.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCurves.map((curve) => (
                          <div
                            key={curve.instanceId}
                            className="inline-flex items-center gap-1.5 bg-gray-50 border rounded-full px-2 py-0.5"
                            style={{ borderColor: curve.color }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: curve.color }}></div>
                            <span className="text-xs font-medium text-gray-700">
                              {curve.instanceVersion}
                            </span>
                            {curve.isPrimary && (
                              <span className="text-[9px] font-semibold bg-green-500 text-white px-1.5 py-0.5 rounded">
                                PRIMARY
                              </span>
                            )}
                            {curve.createdAt && isCurveFreshVintage(curve.createdAt) && (
                              <span className="text-[9px] font-semibold bg-blue-500 text-white px-1.5 py-0.5 rounded">
                                CURRENT
                              </span>
                            )}
                            <button
                              onClick={() => removeCurve(curve.instanceId)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <InteractiveMultiCurveChart 
                    data={curveData} 
                    selectedCurves={selectedCurves}
                    startDate={timeFilter.startDate}
                    endDate={timeFilter.endDate}
                    commodity="Total Revenue"
                    viewMode={viewMode}
                  />
                </ChartCard>
              </div>

              {/* Compact Stats Sidebar */}
              <div className="space-y-3">
                {/* Comprehensive Range Stats */}
                {rangeStats && (
                  <div className="bg-white rounded-lg shadow-sm p-3" style={{ borderLeft: '4px solid #3B82F6' }}>
                    <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                      {viewMode === 'monthly' ? 'Monthly' : 'Annual'} Statistics
                    </h3>
                    <div className="space-y-2">
                      {/* Overall Average of All P-values */}
                      {rangeStats.overallAvg && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded p-2 border border-blue-200">
                          <div className="text-[10px] text-gray-700 uppercase tracking-wide font-semibold">Overall Average (All P-values)</div>
                          <div 
                            className="text-base font-bold text-blue-900"
                            style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                          >
                            ${rangeStats.overallAvg.toFixed(0)}
                          </div>
                        </div>
                      )}
                      
                      {/* Individual P-value Stats */}
                      {rangeStats.P50 && (
                        <div className="bg-blue-50 rounded p-2">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">P50 (Median)</div>
                          <div 
                            className="text-sm font-bold text-gray-900"
                            style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                          >
                            Avg: ${rangeStats.P50.avg.toFixed(0)}
                          </div>
                          <div className="text-[9px] text-gray-600 mt-0.5">
                            Range: ${rangeStats.P50.min.toFixed(0)} - ${rangeStats.P50.max.toFixed(0)}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        {rangeStats.P5 && (
                          <div className="bg-cyan-50 rounded p-2">
                            <div className="text-[10px] text-gray-500 uppercase">P5</div>
                            <div 
                              className="text-xs font-bold text-gray-900"
                              style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                            >
                              ${rangeStats.P5.avg.toFixed(0)}
                            </div>
                          </div>
                        )}
                        {rangeStats.P95 && (
                          <div className="bg-cyan-50 rounded p-2">
                            <div className="text-[10px] text-gray-500 uppercase">P95</div>
                            <div 
                              className="text-xs font-bold text-gray-900"
                              style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                            >
                              ${rangeStats.P95.avg.toFixed(0)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {rangeStats.P25 && (
                          <div className="bg-gray-50 rounded p-2">
                            <div className="text-[10px] text-gray-500 uppercase">P25</div>
                            <div 
                              className="text-xs font-bold text-gray-900"
                              style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                            >
                              ${rangeStats.P25.avg.toFixed(0)}
                            </div>
                          </div>
                        )}
                        {rangeStats.P75 && (
                          <div className="bg-gray-50 rounded p-2">
                            <div className="text-[10px] text-gray-500 uppercase">P75</div>
                            <div 
                              className="text-xs font-bold text-gray-900"
                              style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                            >
                              ${rangeStats.P75.avg.toFixed(0)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Data Points</div>
                        <div 
                          className="text-sm font-bold text-gray-900"
                          style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                        >
                          {rangeStats.dataPoints.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Vintage Info */}
                {currentVintageDate && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                    <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Current Vintage</h3>
                    <div 
                      className="text-sm font-bold text-blue-900 mb-1"
                      style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                    >
                      {currentVintageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-blue-700">
                      {allInstances.filter(i => isCurveFreshVintage(i.createdAt)).length} curves
                    </div>
                  </div>
                )}

                {/* Compact Curve Info */}
                {selectedCurves.length > 0 && selectedCurves[0].createdBy && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Primary Curve</h3>
                    <div className="text-xs text-gray-700 space-y-1.5">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block">Created by</span>
                        <span className="font-medium">{selectedCurves[0].createdBy}</span>
                      </div>
                      {selectedCurves[0].createdAt && (
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase block">Upload date</span>
                          <span 
                            className="font-medium"
                            style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                          >
                            {new Date(selectedCurves[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Proportion Analysis */}
            <ChartCard
              title="Energy vs AS Revenue Breakdown"
              accentColor="purple"
              description="Proportional revenue analysis by time period"
            >
              {/* Controls Row */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  {/* Group By Selector */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Group By
                    </label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as 'year' | 'month' | 'quarter')}
                      className="text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                    >
                      <option value="year">Yearly</option>
                      <option value="quarter">Quarterly</option>
                      <option value="month">Monthly</option>
                    </select>
                  </div>

                  {/* Scenario Selector */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Scenario
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedScenario}
                        onChange={(e) => setSelectedScenario(e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                        disabled={availableScenarios.length === 0}
                      >
                        {availableScenarios.length > 0 ? (
                          availableScenarios.map(scenario => (
                            <option key={scenario} value={scenario}>
                              {scenario}
                            </option>
                          ))
                        ) : (
                          <option value="P50">P50</option>
                        )}
                      </select>
                      
                      {/* Show/Hide P-value Toggle */}
                      {availableScenarios.length > 1 && (
                        <button
                          onClick={() => setShowScenarioToggle(!showScenarioToggle)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            showScenarioToggle 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title="Toggle quick scenario selection"
                        >
                          {availableScenarios.length} P-values
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick P-value Buttons (when toggle is on) */}
                {showScenarioToggle && availableScenarios.length > 1 && (
                  <div className="flex items-center gap-1">
                    {availableScenarios.map(scenario => (
                      <button
                        key={scenario}
                        onClick={() => setSelectedScenario(scenario)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          selectedScenario === scenario
                            ? 'bg-blue-500 text-white font-semibold'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {scenario}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Revenue Proportion Chart */}
              <RevenueProportionChart
                data={curveData}
                selectedCurves={selectedCurves}
                startDate={timeFilter.startDate}
                endDate={timeFilter.endDate}
                selectedScenario={selectedScenario}
                groupBy={groupBy}
              />
            </ChartCard>
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

        {/* Compact Curve Selector */}
        {!loading && allInstances.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm" style={{ borderLeft: '4px solid #8B5CF6' }}>
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Available Curves for Comparison</h3>
              <p className="text-xs text-gray-600">
                {allInstances.length} curves • Click to add/remove • Compare vintages by date
              </p>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-1.5">
                {allInstances
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((inst) => {
                    const isSelected = selectedCurves.some(sc => sc.instanceId === inst.instanceId);
                    const selectedInfo = selectedCurves.find(sc => sc.instanceId === inst.instanceId);
                    const isFresh = isCurveFreshVintage(inst.createdAt);
                    
                    return (
                      <div
                        key={inst.instanceId}
                        onClick={() => addInstanceAsOverlay(inst)}
                        className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selectedInfo?.color }}></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                className="font-semibold text-gray-900 text-xs"
                                style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                              >
                                {inst.instanceVersion}
                              </span>
                              {inst.createdBy?.toLowerCase().includes('gridstor') && (
                                <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                  GridStor
                                </span>
                              )}
                              {inst.hasPValues && (
                                <span className="text-[9px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  P-values
                                </span>
                              )}
                              {isFresh && (
                                <span className="text-[9px] font-semibold bg-blue-500 text-white px-1.5 py-0.5 rounded">
                                  CURRENT
                                </span>
                              )}
                              {selectedInfo?.isPrimary && (
                                <span className="text-[9px] font-semibold bg-green-600 text-white px-1.5 py-0.5 rounded">
                                  PRIMARY
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-600 mt-0.5">
                              {inst.curveName} • {inst.createdBy} • {new Date(inst.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {isSelected ? (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-gray-400 text-xs">Add</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {!loading && curveDefinitions.length === 0 && selectedLocation && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">No curves available for this location.</p>
          </div>
        )}
      </div>
    </div>
  );
}

