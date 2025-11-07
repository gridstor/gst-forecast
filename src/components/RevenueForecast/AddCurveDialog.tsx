import React from 'react';
import { X } from 'lucide-react';
import type { Market } from './MarketBadge';

interface Location {
  definitionId: number;
  name: string;
  location: string;
  market: Market;
  locationType: string;
}

interface AddCurveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onSelectLocation: (definitionId: number, name: string, market: Market) => void;
}

export function AddCurveDialog({
  isOpen,
  onClose,
  locations,
  onSelectLocation
}: AddCurveDialogProps) {
  if (!isOpen) return null;

  const locationsByMarket = {
    CAISO: locations.filter(loc => loc.market === 'CAISO'),
    ERCOT: locations.filter(loc => loc.market === 'ERCOT'),
    SPP: locations.filter(loc => loc.market === 'SPP')
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#2A2A2A] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add Curve to Chart
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Select a location to compare
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* CAISO Locations */}
          {locationsByMarket.CAISO.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                CAISO
              </div>
              <div className="space-y-1">
                {locationsByMarket.CAISO.map((loc) => (
                  <button
                    key={loc.definitionId}
                    onClick={() => {
                      onSelectLocation(loc.definitionId, loc.location, 'CAISO');
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{loc.location}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">{loc.locationType}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ERCOT Locations */}
          {locationsByMarket.ERCOT.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                ERCOT
              </div>
              <div className="space-y-1">
                {locationsByMarket.ERCOT.map((loc) => (
                  <button
                    key={loc.definitionId}
                    onClick={() => {
                      onSelectLocation(loc.definitionId, loc.location, 'ERCOT');
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{loc.location}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">{loc.locationType}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SPP Locations */}
          {locationsByMarket.SPP.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                SPP
              </div>
              <div className="space-y-1">
                {locationsByMarket.SPP.map((loc) => (
                  <button
                    key={loc.definitionId}
                    onClick={() => {
                      onSelectLocation(loc.definitionId, loc.location, 'SPP');
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{loc.location}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">{loc.locationType}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

