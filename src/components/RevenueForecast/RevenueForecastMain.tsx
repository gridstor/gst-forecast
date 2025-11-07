import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, MapPin, Circle } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'cards' | 'graph'>('cards');
  const [chartViewMode, setChartViewMode] = useState<'monthly' | 'annual'>('annual');
  const [dateRange, setDateRange] = useState<string>('lifetime');
  const [fromMonth, setFromMonth] = useState<string>('');
  const [toMonth, setToMonth] = useState<string>('');
  
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

  // Group locations by type and create badge groups
  const getHubsAndNodes = (market: Market) => {
    const marketLocs = locationsByMarket[market];
    const hubs = marketLocs.filter(loc => loc.locationType?.toUpperCase() === 'HUB');
    const nodes = marketLocs.filter(loc => !loc.locationType || loc.locationType?.toUpperCase() === 'NODE');
    
    // Group hubs that should be on the same card (e.g., North Hub + South Hub)
    const groupedHubs = groupLocationsByBaseType(hubs);
    const groupedNodes = groupLocationsByBaseType(nodes);
    
    return {
      hubs: groupedHubs,
      nodes: groupedNodes
    };
  };
  
  // Group locations that share similar base names (e.g., "North Hub" and "South Hub" → "Hub")
  const groupLocationsByBaseType = (locations: LocationData[]) => {
    const groups: Array<{
      baseLocation: string;
      locations: LocationData[];
      badges: string[];
    }> = [];
    
    // Group by market - all locations in same market can be grouped
    if (locations.length === 0) return groups;
    
    // Simple grouping: if multiple locations exist, group them together
    if (locations.length === 1) {
      groups.push({
        baseLocation: locations[0].location,
        locations: [locations[0]],
        badges: [locations[0].location]
      });
    } else {
      // Multiple locations - group them all together
      groups.push({
        baseLocation: locations[0].location, // Use first as base
        locations: locations,
        badges: locations.map(loc => loc.location)
      });
    }
    
    return groups;
  };

  const handleLocationClick = (definitionId: number, name: string, market: Market) => {
    const specificLocation = selectedBadgesMap[name] || name;
    setSelectedLocation({
      definitionId,
      name,
      market,
      specificLocation
    });
    setViewMode('graph');
  };

  const handleBadgeToggle = (locationName: string, badge: string) => {
    setSelectedBadgesMap(prev => ({
      ...prev,
      [locationName]: badge
    }));
  };

  const handleAddCurve = (definitionId: number, name: string, market: Market) => {
    const specificLocation = selectedBadgesMap[name] || name;
    const newCurve = {
      id: `${definitionId}-${Date.now()}`,
      definitionId,
      name,
      market,
      specificLocation
    };
    
    if (!addedCurves.find(c => c.definitionId === definitionId)) {
      setAddedCurves([...addedCurves, newCurve]);
    }
  };

  const handleRemoveCurve = (index: number) => {
    setAddedCurves(addedCurves.filter((_, i) => i !== index));
  };

  const stats = {
    markets: Object.keys(locationsByMarket).filter(k => locationsByMarket[k as Market].length > 0).length,
    hubs: locations.filter(loc => loc.locationType === 'Hub').length,
    nodes: locations.filter(loc => loc.locationType === 'Node' || loc.locationType === null).length,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <AnimatePresence mode="wait">
        {viewMode === 'cards' ? (
          /* CARD VIEW */
          <motion.div
            key="cards-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1200px] mx-auto px-4 py-4"
          >
            <div className="bg-white dark:bg-[#2A2A2A] rounded-lg shadow-sm p-4 mb-6">
              {/* Section Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    All Markets & Locations
                  </h2>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Click card to view detailed forecasts and graphs
                  </div>
                </div>

                {/* Stats + Time Controls */}
                <div className="flex items-start gap-4">
                  {/* Market Overview Stats */}
                  <div className="flex flex-col gap-1 text-[10px] text-gray-500 dark:text-gray-500 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-amber-500" />
                      <span className="font-mono">{stats.markets} Markets</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Circle className="w-3 h-3 text-cyan-500" />
                      <span className="font-mono">{stats.hubs} Hubs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      <span className="font-mono">{stats.nodes} Nodes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Circle className="w-2 h-2 text-green-500 fill-green-500" />
                      <span className="font-mono">Updated: {stats.lastUpdate}</span>
                    </div>
                  </div>

                  {/* Time Period Controls */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Next:</span>
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
                        {['1y', '5y', '10y', 'lifetime'].map((range) => (
                          <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                              dateRange === range
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {range === 'lifetime' ? 'Lifetime' : range}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Month Range Dropdowns */}
                    <div className="flex items-center gap-0.5">
                      <select
                        value={fromMonth}
                        onChange={(e) => {
                          setFromMonth(e.target.value);
                          setDateRange('custom');
                        }}
                        className="w-[100px] h-6 text-[10px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1"
                      >
                        <option value="">Select start</option>
                        <option value="2025-01">Jan 2025</option>
                        <option value="2025-06">Jun 2025</option>
                        <option value="2025-12">Dec 2025</option>
                        <option value="2026-01">Jan 2026</option>
                      </select>
                      <span className="text-[10px] text-gray-400">→</span>
                      <select
                        value={toMonth}
                        onChange={(e) => {
                          setToMonth(e.target.value);
                          setDateRange('custom');
                        }}
                        className="w-[100px] h-6 text-[10px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1"
                      >
                        <option value="">Select end</option>
                        <option value="2026-12">Dec 2026</option>
                        <option value="2027-12">Dec 2027</option>
                        <option value="2030-12">Dec 2030</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-4 mt-3"></div>

              {/* Market Headers */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    CAISO
                  </h3>
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    ERCOT
                  </h3>
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    SPP
                  </h3>
                </div>
              </div>

              {/* First Row - Hubs */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {(['CAISO', 'ERCOT', 'SPP'] as Market[]).map(market => {
                  const { hubs } = getHubsAndNodes(market);
                  const hubGroup = hubs[0];
                  
                  if (!hubGroup) {
                    return (
                      <LocationCard
                        key={`empty-hub-${market}`}
                        name=""
                        type="Hub"
                        market={market}
                        metrics={{ energyArb: '$0', as: '$0', cap: '$0', total: '$0', p95: '$0', p50: '$0', p05: '$0' }}
                        isEmpty={true}
                      />
                    );
                  }
                  
                  // Get the currently selected badge for this group
                  const selectedBadge = selectedBadgesMap[hubGroup.baseLocation] || hubGroup.badges[0];
                  const selectedLocation = hubGroup.locations.find(loc => loc.location === selectedBadge) || hubGroup.locations[0];
                  
                  return (
                    <LocationCard
                      key={`hub-${market}`}
                      name={hubGroup.baseLocation}
                      type={selectedLocation.locationType || 'Hub'}
                      market={market}
                      badges={hubGroup.badges.length > 1 ? hubGroup.badges : undefined}
                      metrics={selectedLocation.metrics}
                      curveCreator={selectedLocation.latestInstance?.createdBy}
                      creationDate={selectedLocation.latestInstance?.createdAt ? new Date(selectedLocation.latestInstance.createdAt).toLocaleDateString() : undefined}
                      selectedBadge={selectedBadge}
                      onBadgeToggle={(badge) => handleBadgeToggle(hubGroup.baseLocation, badge)}
                      onClick={() => handleLocationClick(selectedLocation.definitionId, selectedLocation.location, market)}
                    />
                  );
                })}
              </div>

              {/* Second Row - Nodes */}
              <div className="grid grid-cols-3 gap-4">
                {(['CAISO', 'ERCOT', 'SPP'] as Market[]).map(market => {
                  const { nodes } = getHubsAndNodes(market);
                  const nodeGroup = nodes[0];
                  
                  if (!nodeGroup) {
                    return (
                      <LocationCard
                        key={`empty-node-${market}`}
                        name=""
                        type="Node"
                        market={market}
                        metrics={{ energyArb: '$0', as: '$0', cap: '$0', total: '$0', p95: '$0', p50: '$0', p05: '$0' }}
                        isEmpty={true}
                      />
                    );
                  }
                  
                  // Get the currently selected badge for this group
                  const selectedBadge = selectedBadgesMap[nodeGroup.baseLocation] || nodeGroup.badges[0];
                  const selectedLocation = nodeGroup.locations.find(loc => loc.location === selectedBadge) || nodeGroup.locations[0];
                  
                  return (
                    <LocationCard
                      key={`node-${market}`}
                      name={nodeGroup.baseLocation}
                      type={selectedLocation.locationType || 'Node'}
                      market={market}
                      badges={nodeGroup.badges.length > 1 ? nodeGroup.badges : undefined}
                      metrics={selectedLocation.metrics}
                      curveCreator={selectedLocation.latestInstance?.createdBy}
                      creationDate={selectedLocation.latestInstance?.createdAt ? new Date(selectedLocation.latestInstance.createdAt).toLocaleDateString() : undefined}
                      selectedBadge={selectedBadge}
                      onBadgeToggle={(badge) => handleBadgeToggle(nodeGroup.baseLocation, badge)}
                      onClick={() => handleLocationClick(selectedLocation.definitionId, selectedLocation.location, market)}
                    />
                  );
                })}
              </div>
            </div>
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

