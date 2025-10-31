import React from 'react';
import type { LocationOption } from '../../lib/types';

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  locations: LocationOption[];
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  locations
}) => {
  return (
    <div className="min-w-[240px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border border-[#E5E7EB] py-2 px-3 text-base bg-white text-[#111827] focus:ring-2 focus:ring-[#3B82F6] focus:ring-opacity-50 focus:border-[#3B82F6] outline-none transition-all"
        aria-label="Select Location"
      >
        <option value="">Select a location...</option>
        {locations
          .filter(loc => loc && loc.id) // Filter out invalid items
          .map((loc, index) => (
            <option key={`${loc.id}-${index}`} value={loc.id}>
              {loc.name} ({loc.market})
            </option>
          ))}
      </select>
    </div>
  );
}; 