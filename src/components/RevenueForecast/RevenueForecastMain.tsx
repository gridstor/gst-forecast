import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, MapPin, Circle, Grid3x3, Table, ArrowUpDown, Search, Filter, Calendar, Map } from 'lucide-react';
import { LocationCard } from './LocationCard';
import { CompactLocationCard } from './CompactLocationCard';
import { GraphViewTopBar } from './GraphViewTopBar';
import { RevenueChart } from './RevenueChart';
import { AddCurveDialog } from './AddCurveDialog';
import { calculateMetrics, generateMockMetrics } from './utils/metricCalculator';
import type { Market } from './MarketBadge';

interface LocationData {
  definitionId: number;
  name: string;
  market: Market;
  location: string;
  locationType: string | null; // Can be 'HUB', 'NODE', or null
  batteryDuration: string;
  latestInstance: {
    instanceId: number;
    instanceVersion: string;
    createdAt: string;
    createdBy: string;
  } | null;
  metrics: {
    energyArb: string;
    as: string;
    cap: string;
    total: string;
    p95: string;
    p50: string;
    p05: string;
  };
}

interface SelectedCurve {
  instanceId: number;
  curveName: string;
  instanceVersion: string;
  color: string;
  isPrimary: boolean;
  createdAt?: string;
  createdBy?: string;
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

export default function RevenueForecastMain() {
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');
  const [viewMode, setViewMode] = useState<'cards' | 'graph'>('cards');
  const [chartViewMode, setChartViewMode] = useState<'monthly' | 'annual'>('annual');
  const [dateRange, setDateRange] = useState<string>('10y');
  const [fromMonth, setFromMonth] = useState<string>('');
  const [toMonth, setToMonth] = useState<string>('');
  
  // Filters
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedLocationType, setSelectedLocationType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedVintage, setSelectedVintage] = useState<string>('current');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'high' | 'low' | 'none'>('none');
  const [customStartYear, setCustomStartYear] = useState<string>('2025');
  const [customEndYear, setCustomEndYear] = useState<string>('2034');
  
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<{
    definitionId: number;
    name: string;
    market: Market;
    specificLocation?: string;
  } | null>(null);
  
  const [selectedBadgesMap, setSelectedBadgesMap] = useState<Record<string, string>>({});
  const [addedCurves, setAddedCurves] = useState<Array<{
    id: string;
    definitionId: number;
    name: string;
    market: Market;
    specificLocation?: string;
  }>>([]);
  
  const [curveData, setCurveData] = useState<CurveDataPoint[]>([]);
  const [selectedCurves, setSelectedCurves] = useState<SelectedCurve[]>([]);
  const [isAddCurveDialogOpen, setIsAddCurveDialogOpen] = useState(false);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetch curve data when location changes in graph view
  useEffect(() => {
    if (viewMode === 'graph' && selectedLocation) {
      fetchCurveDataForLocation(selectedLocation.definitionId);
    }
  }, [viewMode, selectedLocation]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curves/definitions');
      if (!response.ok) throw new Error('Failed to fetch curve definitions');
      
      const definitions = await response.json();
      
          // Process definitions into location data
      const processedLocations = await Promise.all(
        definitions.map(async (def: any) => {
          // Fetch latest instance for each definition
          const instanceResponse = await fetch(`/api/curves/instances?definitionId=${def.id}`);
          const instanceData = await instanceResponse.json();
          const latestInstance = instanceData.instances?.[0];
          
          let metrics = generateMockMetrics(); // Default to mock metrics
          
          // Try to fetch real data for metric calculation
          if (latestInstance) {
            try {
              const dataResponse = await fetch(`/api/curves/data?curveInstanceId=${latestInstance.id}`);
              if (dataResponse.ok) {
                const data = await dataResponse.json();
                if (data.priceData && data.priceData.length > 0) {
                  // Calculate metrics from real data
                  metrics = calculateMetrics(data.priceData);
                }
              }
            } catch (err) {
              console.warn(`Failed to calculate metrics for ${def.location}, using mock data`, err);
            }
          }
          
          return {
            definitionId: def.id,
            name: def.curveName,
            market: def.market as Market,
            location: def.location,
            locationType: def.locationType, // Keep as-is from DB (will be HUB or NODE)
            batteryDuration: def.batteryDuration,
            latestInstance: latestInstance ? {
              instanceId: latestInstance.id,
              instanceVersion: latestInstance.instanceVersion,
              createdAt: latestInstance.createdAt,
              createdBy: latestInstance.createdBy
            } : null,
            metrics
          };
        })
      );
      
      setLocations(processedLocations);
      
      // Initialize selected badges (first location for each group)
      const badgesMap: Record<string, string> = {};
      processedLocations.forEach(loc => {
        if (!badgesMap[loc.location]) {
          badgesMap[loc.location] = loc.location;
        }
      });
      setSelectedBadgesMap(badgesMap);
      
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurveDataForLocation = async (definitionId: number) => {
    try {
      // Find the location
      const location = locations.find(loc => loc.definitionId === definitionId);
      if (!location || !location.latestInstance) return;

      // Fetch curve data
      const response = await fetch(`/api/curves/data?curveInstanceId=${location.latestInstance.instanceId}`);
      if (!response.ok) throw new Error('Failed to fetch curve data');
      
      const data = await response.json();
      
      // Format data for chart
      const formattedData = data.priceData?.map((point: any) => ({
        timestamp: point.timestamp,
        value: point.value,
        curveType: point.curveType,
        commodity: point.commodity || 'Total Revenue',
        scenario: point.scenario || 'P50',
        instanceId: location.latestInstance!.instanceId,
        curveName: location.name,
        units: point.units || '$/MWh'
      })) || [];
      
      setCurveData(formattedData);
      
      // Set selected curve info
      setSelectedCurves([{
        instanceId: location.latestInstance.instanceId,
        curveName: location.name,
        instanceVersion: location.latestInstance.instanceVersion,
        color: '#3B82F6',
        isPrimary: true,
        createdAt: location.latestInstance.createdAt,
        createdBy: location.latestInstance.createdBy
      }]);
      
    } catch (err) {
      console.error('Error fetching curve data:', err);
    }
  };

  // Group locations by market
  const locationsByMarket = {
    CAISO: locations.filter(loc => loc.market === 'CAISO'),
    ERCOT: locations.filter(loc => loc.market === 'ERCOT'),
    SPP: locations.filter(loc => loc.market === 'SPP')
  };

  const handleLocationClick = (definitionId: number, name: string, market: Market) => {
    setSelectedLocation({
      definitionId,
      name,
      market
    });
    setViewMode('graph');
  };

  const handleAddCurve = (definitionId: number, name: string, market: Market) => {
    const newCurve = {
      id: `${definitionId}-${Date.now()}`,
      definitionId,
      name,
      market
    };
    
    if (!addedCurves.find(c => c.definitionId === definitionId)) {
      setAddedCurves([...addedCurves, newCurve]);
    }
  };

  const handleRemoveCurve = (index: number) => {
    setAddedCurves(addedCurves.filter((_, i) => i !== index));
  };

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let filtered = [...locations];

    // Apply quick filter
    if (quickFilter) {
      if (quickFilter === 'caiso') {
        filtered = filtered.filter(loc => loc.market === 'CAISO');
      } else if (quickFilter === 'ercot') {
        filtered = filtered.filter(loc => loc.market === 'ERCOT');
      } else if (quickFilter === 'spp') {
        filtered = filtered.filter(loc => loc.market === 'SPP');
      } else if (quickFilter === 'hubs') {
        filtered = filtered.filter(loc => loc.locationType?.toUpperCase() === 'HUB');
      }
    } else {
      // Apply market filter (if no quick filter)
      if (selectedMarket !== 'all') {
        filtered = filtered.filter(loc => loc.market === selectedMarket);
      }

      // Apply location type filter
      if (selectedLocationType !== 'all') {
        filtered = filtered.filter(loc => {
          const locType = loc.locationType?.toUpperCase() || 'NODE';
          return locType === selectedLocationType.toUpperCase();
        });
      }
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(loc => 
        loc.location.toLowerCase().includes(query) ||
        loc.name.toLowerCase().includes(query) ||
        loc.market.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortOrder !== 'none') {
      filtered.sort((a, b) => {
        const aTotal = parseFloat(a.metrics.total.replace('$', '').replace(/,/g, ''));
        const bTotal = parseFloat(b.metrics.total.replace('$', '').replace(/,/g, ''));
        return sortOrder === 'high' ? bTotal - aTotal : aTotal - bTotal;
      });
    }

    return filtered;
  }, [locations, selectedMarket, selectedLocationType, searchQuery, quickFilter, sortOrder]);

  const stats = {
    markets: Object.keys(locationsByMarket).filter(k => locationsByMarket[k as Market].length > 0).length,
    hubs: locations.filter(loc => loc.locationType?.toUpperCase() === 'HUB').length,
    nodes: locations.filter(loc => !loc.locationType || loc.locationType?.toUpperCase() === 'NODE').length,
    lastUpdate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading revenue forecasts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchLocations}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Helper function to format location type for display
  const formatLocationType = (type: string | null): string => {
    if (!type) return 'Node';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  // Helper function to get market colors
  const getMarketColors = (market: Market) => {
    const colors = {
      CAISO: {
        badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        total: 'text-blue-600 dark:text-blue-400'
      },
      ERCOT: {
        badge: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        total: 'text-red-600 dark:text-red-400'
      },
      SPP: {
        badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        total: 'text-emerald-600 dark:text-emerald-400'
      }
    };
    return colors[market];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <AnimatePresence mode="wait">
        {viewMode === 'cards' ? (
          /* CARD/TABLE VIEW */
          <motion.div
            key="cards-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1400px] mx-auto px-4 py-6"
          >
            {/* Filter & Control Bar */}
            <div className="bg-white rounded-lg shadow-sm mb-6 border border-[#E5E7EB] p-4">
              {/* First Row: Filter Icon + Dropdowns + Search */}
              <div className="flex items-center gap-3 mb-3">
                <Filter className="w-4 h-4 text-[#6B7280]" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="rounded-md border border-[#E5E7EB] py-1 px-2.5 text-xs bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all h-8"
                >
                  <option value="all">All Regions</option>
                  <option value="west">West</option>
                  <option value="central">Central</option>
                  <option value="east">East</option>
                </select>
                <select
                  value={selectedLocationType}
                  onChange={(e) => {
                    setSelectedLocationType(e.target.value);
                    setQuickFilter(''); // Clear quick filter when manually selecting type
                  }}
                  className="rounded-md border border-[#E5E7EB] py-1 px-2.5 text-xs bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all h-8"
                >
                  <option value="all">All Types ({locations.length})</option>
                  <option value="Hub">Hub ({locations.filter(loc => loc.locationType?.toUpperCase() === 'HUB').length})</option>
                  <option value="Node">Node ({locations.filter(loc => !loc.locationType || loc.locationType?.toUpperCase() === 'NODE').length})</option>
                </select>
                <select
                  value={selectedVintage}
                  onChange={(e) => setSelectedVintage(e.target.value)}
                  className="rounded-md border border-[#E5E7EB] py-1 px-2.5 text-xs bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all h-8"
                >
                  <option value="current">Current Vintage</option>
                  <option value="all">All Vintages</option>
                </select>
                <div className="flex-1 flex items-center gap-2 border border-[#E5E7EB] rounded-md px-2.5 py-1 bg-white h-8">
                  <Search className="w-3.5 h-3.5 text-[#6B7280]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search locations..."
                    className="flex-1 text-xs text-[#111827] outline-none bg-transparent placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              {/* Second Row: Forecast Period */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-[#6B7280]" />
                <span className="text-xs text-[#111827] font-medium">Forecast Period:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { value: '1y', label: 'Next 1 Year' },
                    { value: '5y', label: 'Next 5 Years' },
                    { value: '10y', label: 'Next 10 Years' },
                    { value: 'lifetime', label: 'Lifetime' }
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => {
                        setDateRange(period.value);
                        setCustomStartYear('');
                        setCustomEndYear('');
                      }}
                      className={`px-2 py-1 text-xs font-medium rounded-full border transition-colors ${
                        dateRange === period.value
                          ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                          : 'bg-white text-[#111827] border-[#E5E7EB] hover:bg-gray-50'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-[#6B7280] ml-1.5">or Custom:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customStartYear}
                    onChange={(e) => {
                      setCustomStartYear(e.target.value);
                      setDateRange('custom');
                    }}
                    placeholder="2025"
                    className="w-16 rounded-md border border-[#E5E7EB] py-1 px-2 text-xs text-[#111827] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all h-7"
                  />
                  <span className="text-xs text-[#6B7280]">to</span>
                  <input
                    type="text"
                    value={customEndYear}
                    onChange={(e) => {
                      setCustomEndYear(e.target.value);
                      setDateRange('custom');
                    }}
                    placeholder="2034"
                    className="w-16 rounded-md border border-[#E5E7EB] py-1 px-2 text-xs text-[#111827] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all h-7"
                  />
                </div>
              </div>

              {/* Third Row: Quick Filters */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[#111827] font-medium">Quick:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setQuickFilter(quickFilter === 'caiso' ? '' : 'caiso');
                      setSelectedMarket('all');
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                      quickFilter === 'caiso'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    CAISO All
                  </button>
                  <button
                    onClick={() => {
                      setQuickFilter(quickFilter === 'ercot' ? '' : 'ercot');
                      setSelectedMarket('all');
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                      quickFilter === 'ercot'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    ERCOT All
                  </button>
                  <button
                    onClick={() => {
                      setQuickFilter(quickFilter === 'spp' ? '' : 'spp');
                      setSelectedMarket('all');
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                      quickFilter === 'spp'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    SPP All
                  </button>
                  <button
                    onClick={() => {
                      setQuickFilter(quickFilter === 'hubs' ? '' : 'hubs');
                      setSelectedLocationType('all');
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                      quickFilter === 'hubs'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    All Hubs
                  </button>
                </div>
              </div>

              {/* Bottom Right: View Toggles */}
              <div className="flex justify-end items-center gap-2">
                <button
                  onClick={() => setDisplayMode('cards')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
                    displayMode === 'cards'
                      ? 'bg-gray-100 text-[#111827] border-gray-300'
                      : 'bg-white text-[#111827] border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  Map View
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
                    displayMode === 'table'
                      ? 'bg-gray-100 text-[#111827] border-gray-300'
                      : 'bg-white text-[#111827] border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  Table View
                </button>
              </div>
            </div>

            {/* Card View */}
            {displayMode === 'cards' && (
              <div className="grid grid-cols-3 gap-4">
                {filteredLocations.map(location => (
                  <LocationCard
                    key={location.definitionId}
                    name={location.location}
                    type={formatLocationType(location.locationType)}
                    market={location.market}
                    metrics={location.metrics}
                    curveCreator={location.latestInstance?.createdBy}
                    creationDate={location.latestInstance?.createdAt ? new Date(location.latestInstance.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
                    onClick={() => handleLocationClick(location.definitionId, location.location, location.market)}
                  />
                ))}
              </div>
            )}

            {/* Table View */}
            {displayMode === 'table' && (
              <div className="bg-white dark:bg-[#2A2A2A] rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Market</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Location</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">ARB</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">AS</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">CAP</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">P95</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">P50</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">P05</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Source</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLocations.map(location => {
                        const marketColors = getMarketColors(location.market);
                        const creator = location.latestInstance?.createdBy || 'Unknown';
                        const creationDate = location.latestInstance?.createdAt 
                          ? new Date(location.latestInstance.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Unknown';
                        
                        return (
                          <tr
                            key={location.definitionId}
                            onClick={() => handleLocationClick(location.definitionId, location.location, location.market)}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          >
                            <td className="px-3 py-2">
                              <div className={`${marketColors.badge} text-[9px] px-1.5 py-0.5 rounded font-bold inline-block`}>
                                {location.market}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {formatLocationType(location.locationType)}
                            </td>
                            <td className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {location.location}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">{location.metrics.energyArb}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">{location.metrics.as}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">{location.metrics.cap}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">{location.metrics.p95}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">{location.metrics.p50}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">{location.metrics.p05}</td>
                            <td className={`px-3 py-2 font-mono font-bold text-sm ${marketColors.total}`}>
                              {location.metrics.total}
                            </td>
                            <td className="px-3 py-2 text-[9px] text-gray-500 dark:text-gray-400">
                              {creator.replace('GridStor P50', 'GridStor').replace('ASCEND Forecast', 'ASCEND')}
                            </td>
                            <td className="px-3 py-2 text-[9px] text-gray-500 dark:text-gray-400">{creationDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredLocations.length === 0 && (
              <div className="bg-white dark:bg-[#2A2A2A] rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-2">
                  <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  No forecasts found
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Try adjusting your filters to see more results
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          /* GRAPH VIEW */
          <motion.div
            key="graph-view"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex min-h-screen"
          >
            {/* Main Graph Area */}
            <div className="flex-1 flex flex-col">
              {/* Top Bar */}
              {selectedLocation && (
                <GraphViewTopBar
                  selectedLocation={selectedLocation}
                  chartViewMode={chartViewMode}
                  dateRange={dateRange}
                  fromMonth={fromMonth}
                  toMonth={toMonth}
                  addedCurves={addedCurves}
                  onBack={() => setViewMode('cards')}
                  onChartViewModeChange={setChartViewMode}
                  onDateRangeChange={setDateRange}
                  onFromMonthChange={setFromMonth}
                  onToMonthChange={setToMonth}
                  onAddCurve={() => setIsAddCurveDialogOpen(true)}
                  onRemoveCurve={handleRemoveCurve}
                />
              )}

              {/* Add Curve Dialog */}
              <AddCurveDialog
                isOpen={isAddCurveDialogOpen}
                onClose={() => setIsAddCurveDialogOpen(false)}
                locations={locations.map(loc => ({
                  definitionId: loc.definitionId,
                  name: loc.name,
                  location: loc.location,
                  market: loc.market,
                  locationType: loc.locationType || 'Hub'
                }))}
                onSelectLocation={handleAddCurve}
              />

              {/* Chart Area */}
              <div className="pt-6 px-6 pb-6 bg-gray-50 dark:bg-gray-900">
                <RevenueChart
                  data={curveData}
                  selectedCurves={selectedCurves}
                  startDate={fromMonth || null}
                  endDate={toMonth || null}
                  viewMode={chartViewMode}
                  height={400}
                />
              </div>
            </div>

            {/* Compact Location Sidebar */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="w-48 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-3 overflow-y-auto"
            >
              <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                All Locations
              </h3>

              {/* CAISO Locations */}
              {locationsByMarket.CAISO.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                    CAISO
                  </div>
                  <div className="space-y-2">
                    {locationsByMarket.CAISO.map(loc => (
                      <CompactLocationCard
                        key={loc.definitionId}
                        name={loc.location}
                        type={loc.locationType || 'Hub'}
                        market="CAISO"
                        metrics={loc.metrics}
                        selectedBadge={selectedBadgesMap[loc.location]}
                        isSelected={selectedLocation?.definitionId === loc.definitionId}
                        onClick={() => handleLocationClick(loc.definitionId, loc.location, 'CAISO')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ERCOT Locations */}
              {locationsByMarket.ERCOT.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                    ERCOT
                  </div>
                  <div className="space-y-2">
                    {locationsByMarket.ERCOT.map(loc => (
                      <CompactLocationCard
                        key={loc.definitionId}
                        name={loc.location}
                        type={loc.locationType || 'Hub'}
                        market="ERCOT"
                        metrics={loc.metrics}
                        selectedBadge={selectedBadgesMap[loc.location]}
                        isSelected={selectedLocation?.definitionId === loc.definitionId}
                        onClick={() => handleLocationClick(loc.definitionId, loc.location, 'ERCOT')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SPP Locations */}
              {locationsByMarket.SPP.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    SPP
                  </div>
                  <div className="space-y-2">
                    {locationsByMarket.SPP.map(loc => (
                      <CompactLocationCard
                        key={loc.definitionId}
                        name={loc.location}
                        type={loc.locationType || 'Hub'}
                        market="SPP"
                        metrics={loc.metrics}
                        selectedBadge={selectedBadgesMap[loc.location]}
                        isSelected={selectedLocation?.definitionId === loc.definitionId}
                        onClick={() => handleLocationClick(loc.definitionId, loc.location, 'SPP')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Tip:</span> Click any location to update the chart above.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

