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
  product: string;
  curveType: string;
  scenario: string;
  units: string;
  granularity: string;
  latestInstance: {
    instanceId: number;
    instanceVersion: string;
    status: string;
    createdAt: string;
    createdBy: string;
  } | null;
}

interface CurveDataPoint {
  timestamp: string;
  valueP5: number | null;
  valueP25: number | null;
  valueP50: number | null;
  valueP75: number | null;
  valueP95: number | null;
  instanceId: number;
  curveName: string;
  units: string;
  scenario: string;
}

export default function CurveViewerEnhanced() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [curveDefinitions, setCurveDefinitions] = useState<CurveDefinition[]>([]);
  const [selectedCurves, setSelectedCurves] = useState<number[]>([]);
  const [curveData, setCurveData] = useState<CurveDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

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
      
      // Set first location as default
      if (data.length > 0) {
        setSelectedLocation(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    }
  };

  const fetchCurveDefinitions = async (market: string, location: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/curves/by-location-enhanced?market=${encodeURIComponent(market)}&location=${encodeURIComponent(location)}`
      );
      if (!response.ok) throw new Error('Failed to fetch curve definitions');
      const data = await response.json();
      setCurveDefinitions(data);
      
      // Auto-select the first curve with a latest instance
      const firstCurveWithInstance = data.find((d: CurveDefinition) => d.latestInstance);
      if (firstCurveWithInstance && firstCurveWithInstance.latestInstance) {
        setSelectedCurves([firstCurveWithInstance.latestInstance.instanceId]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch curves');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurveData = async (instanceIds: number[]) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/curves/data-with-pvalues?instanceIds=${instanceIds.join(',')}`
      );
      if (!response.ok) throw new Error('Failed to fetch curve data');
      const data = await response.json();
      setCurveData(data);
    } catch (err) {
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

  // Group curves by granularity
  const curvesByGranularity = React.useMemo(() => {
    return curveDefinitions.reduce((acc, curve) => {
      const gran = curve.granularity?.toUpperCase() || 'MONTHLY';
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
      {/* Location Selector */}
      <div className="bg-white rounded-lg p-6 accent-border-blue" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#2A2A2A]" style={{ letterSpacing: '-0.01em' }}>
            Select a Location
          </h1>
          <select
            value={selectedLocation?.id || ''}
            onChange={(e) => {
              const loc = locations.find(l => l.id === e.target.value);
              setSelectedLocation(loc || null);
            }}
            className="flex-1 max-w-md px-4 py-2 border border-[#E5E7EB] rounded-md bg-white text-[#111827] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 outline-none transition-all"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
              Revenue Forecast Projection
            </h2>
            <p className="text-sm text-[#6B7280] mb-4">
              P25-P75 interquartile range (gray) • P5-P95 full range (cyan) • P50 median line
            </p>
            <DualRangeChart data={curveData} color="#34D5ED" />
          </div>
        </div>
      )}

      {/* Curve Selection by Granularity */}
      {Object.entries(curvesByGranularity).map(([granularity, curves]) => (
        <div 
          key={granularity}
          className="bg-white rounded-lg overflow-hidden accent-border-purple" 
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#1F2937] mb-4">
              {granularity} Curves
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Curve Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Scenario
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Latest Version
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E7EB]">
                  {curves.map(curve => {
                    const instanceId = curve.latestInstance?.instanceId;
                    const isSelected = instanceId && selectedCurves.includes(instanceId);
                    
                    return (
                      <tr 
                        key={curve.definitionId}
                        className={`hover:bg-[#F9FAFB] transition-colors ${!curve.latestInstance ? 'opacity-50' : ''}`}
                      >
                        <td className="px-3 py-2">
                          {curve.latestInstance && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCurve(curve.latestInstance!.instanceId)}
                              className="w-4 h-4 text-[#3B82F6] border-[#E5E7EB] rounded focus:ring-[#3B82F6]"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-[#111827] font-medium">
                          {curve.curveName}
                        </td>
                        <td className="px-3 py-2 text-sm text-[#6B7280]">
                          {curve.product}
                        </td>
                        <td className="px-3 py-2 text-sm text-[#6B7280]">
                          {curve.scenario}
                        </td>
                        <td className="px-3 py-2 text-sm text-[#6B7280] font-mono">
                          {curve.latestInstance?.instanceVersion || 'No instance'}
                        </td>
                        <td className="px-3 py-2">
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
      ))}

      {!loading && curveDefinitions.length === 0 && selectedLocation && (
        <div className="bg-white rounded-lg p-12 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p className="text-[#6B7280]">No curves available for this location.</p>
        </div>
      )}
    </div>
  );
}

