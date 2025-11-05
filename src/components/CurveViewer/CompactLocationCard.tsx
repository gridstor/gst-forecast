import React, { useState } from 'react';

interface LocationCardProps {
  name: string;
  market: string;
  location: string;
  energyArbitrage: number;
  ancillaryServices: number;
  capacity: number;
  curveSource: string;
  isSelected: boolean;
  onClick: () => void;
}

interface CompactLocationCardProps {
  locations: LocationCardProps[];
  market: string;
  type: 'hub' | 'location';
}

export default function CompactLocationCard({ locations, market, type }: CompactLocationCardProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (locations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 min-h-[120px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            No Data
          </div>
        </div>
      </div>
    );
  }

  const getMarketColor = (market: string) => {
    switch (market) {
      case 'CAISO': return '#3B82F6';
      case 'ERCOT': return '#EF4444';
      case 'SPP': return '#10B981';
      default: return '#6B7280';
    }
  };

  const color = getMarketColor(market);
  const activeLocation = locations[activeTab];
  const total = activeLocation.energyArbitrage + activeLocation.ancillaryServices + activeLocation.capacity;

  return (
    <button
      onClick={activeLocation.onClick}
      className={`bg-white rounded-lg p-1 border-l-3 transition-all duration-200 text-left w-full h-full ${
        activeLocation.isSelected 
          ? 'shadow-lg ring-2 ring-offset-1' 
          : 'shadow-sm hover:shadow-md'
      }`}
      style={{
        borderColor: color,
        minHeight: '110px',
        ...(activeLocation.isSelected && { ringColor: color })
      }}
    >
      {/* Tabs if multiple locations */}
      {locations.length > 1 && (
        <div className="flex gap-0.5 mb-0.5 -mt-0.5 -mx-0.5">
          {locations.map((loc, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(idx);
              }}
              className={`text-[7px] px-1 py-0.5 rounded transition-colors ${
                activeTab === idx
                  ? 'font-semibold text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{ 
                backgroundColor: activeTab === idx ? color : 'transparent',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-0">
        <div className="flex items-center gap-0.5">
          <div 
            className="w-1 h-1 rounded-full flex-shrink-0" 
            style={{ backgroundColor: color }}
          />
          <h3 
            className="text-[11px] font-semibold text-gray-900 leading-tight" 
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {activeLocation.name}
          </h3>
        </div>
        <div 
          className="text-xs font-bold leading-tight"
          style={{ 
            color: color,
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          ${total.toFixed(2)}
        </div>
      </div>
      
      {/* Type Badge */}
      <div 
        className="text-[7px] text-gray-500 mb-0.5 uppercase tracking-wide leading-tight"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {type === 'hub' ? '⚡ Hub/Node' : '📍 Location'}
      </div>
      
      {/* Divider */}
      <div className="border-t border-gray-200 mb-0.5" />
      
      {/* Energy Arbitrage */}
      <div className="bg-gray-50 rounded px-0.5 py-0.5 mb-0.5">
        <div 
          className="text-[7px] uppercase tracking-wide font-semibold text-gray-500 leading-tight"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          ENERGY ARB (4H)
        </div>
        <div 
          className="text-xs font-bold text-gray-900 leading-tight"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          ${activeLocation.energyArbitrage.toFixed(2)}
        </div>
        <div 
          className="text-[7px] text-gray-600 leading-tight"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          $/kW-month
        </div>
      </div>
      
      {/* AS & Capacity Grid */}
      <div className="grid grid-cols-2 gap-0.5 mb-0.5">
        <div className="bg-gray-50 rounded px-0.5 py-0.5">
          <div 
            className="text-[7px] uppercase tracking-wide font-semibold text-gray-500 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            AS
          </div>
          <div 
            className="text-[10px] font-bold text-gray-900 leading-tight"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            ${activeLocation.ancillaryServices.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded px-0.5 py-0.5">
          <div 
            className="text-[7px] uppercase tracking-wide font-semibold text-gray-500 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            CAP
          </div>
          <div 
            className="text-[10px] font-bold text-gray-900 leading-tight"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            ${activeLocation.capacity.toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="border-t border-gray-200 pt-0.5">
        <div className="flex items-center justify-between">
          <div 
            className="text-[7px] uppercase tracking-wide font-semibold text-gray-600 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            TOTAL
          </div>
          <div 
            className="text-xs font-bold leading-tight"
            style={{ 
              color: color,
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            ${total.toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Curve Source */}
      <div className="border-t border-gray-100 pt-0.5 mt-0.5">
        <div 
          className="text-[7px] text-gray-500 text-center leading-tight"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {activeLocation.curveSource}
        </div>
      </div>
    </button>
  );
}

