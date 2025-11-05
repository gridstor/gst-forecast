import React, { useState, useEffect } from 'react';

interface Location {
  id: string;
  name: string;
  market: string;
  location: string;
}

interface CurveInstance {
  instanceId: number;
  instanceVersion: string;
  curveName: string;
  createdAt: string;
  createdBy: string;
  market: string;
  location: string;
  hasPValues: boolean;
}

interface CompactCurveSelectorProps {
  onCurveSelect: (instance: CurveInstance) => void;
  selectedInstanceIds: number[];
}

const CompactCurveSelector: React.FC<CompactCurveSelectorProps> = ({
  onCurveSelect,
  selectedInstanceIds
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [instances, setInstances] = useState<CurveInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMarket && selectedLocation) {
      fetchInstances();
    }
  }, [selectedMarket, selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/curves/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/curves/all-instances-for-location?market=${encodeURIComponent(selectedMarket)}&location=${encodeURIComponent(selectedLocation)}`
      );
      if (!response.ok) throw new Error('Failed to fetch instances');
      const data = await response.json();
      setInstances(data.instances || []);
    } catch (error) {
      console.error('Error fetching instances:', error);
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  const markets = [...new Set(locations.map(l => l.market))].sort();
  const locationsForMarket = locations
    .filter(l => l.market === selectedMarket)
    .map(l => l.location)
    .sort();

  const filteredInstances = instances.filter(inst => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inst.instanceVersion.toLowerCase().includes(search) ||
      inst.curveName.toLowerCase().includes(search) ||
      inst.createdBy.toLowerCase().includes(search)
    );
  });

  return (
    <div className="relative">
      {/* Compact Trigger Button - Figma Design System Blue */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Curve Overlay
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Compact Modal - Figma Design System Styling */}
          <div className="absolute left-0 top-full mt-2 w-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header - Cyan Accent from Figma */}
            <div className="px-4 py-3 border-b border-gray-200" style={{ borderLeft: '4px solid #06B6D4' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Select Curve to Overlay
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Location Selectors - Compact */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Market
                  </label>
                  <select
                    value={selectedMarket}
                    onChange={(e) => {
                      setSelectedMarket(e.target.value);
                      setSelectedLocation('');
                      setInstances([]);
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <option value="">Select...</option>
                    {markets.map(market => (
                      <option key={market} value={market}>{market}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    disabled={!selectedMarket}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none disabled:bg-gray-100"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <option value="">Select...</option>
                    {locationsForMarket.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search */}
              {instances.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search curves..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2 py-1 pl-7 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <svg className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Instance List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading curves...</p>
                </div>
              )}

              {!loading && filteredInstances.length === 0 && selectedMarket && selectedLocation && (
                <div className="text-center py-8 text-xs text-gray-500">
                  No curves found
                </div>
              )}

              {!loading && !selectedMarket && (
                <div className="text-center py-8 text-xs text-gray-500">
                  Select a market and location to view curves
                </div>
              )}

              {!loading && filteredInstances.length > 0 && (
                <div className="space-y-1">
                  {filteredInstances
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((inst) => {
                      const isSelected = selectedInstanceIds.includes(inst.instanceId);
                      
                      return (
                        <button
                          key={inst.instanceId}
                          onClick={() => {
                            onCurveSelect(inst);
                            setIsOpen(false);
                          }}
                          disabled={isSelected}
                          className={`w-full text-left p-2 rounded border transition-all ${
                            isSelected 
                              ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
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
                                {isSelected && (
                                  <span className="text-[9px] font-semibold bg-gray-500 text-white px-1.5 py-0.5 rounded">
                                    SELECTED
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-600 mt-0.5">
                                {inst.curveName} • {inst.market} - {inst.location}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {inst.createdBy} • {new Date(inst.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </div>
                            </div>
                            {!isSelected && (
                              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-[10px] text-gray-600 text-center">
                {filteredInstances.length} curve{filteredInstances.length !== 1 ? 's' : ''} available
                {searchTerm && ` • Filtered by "${searchTerm}"`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompactCurveSelector;

