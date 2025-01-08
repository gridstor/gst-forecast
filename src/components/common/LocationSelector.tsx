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
        className="block w-full rounded-md border border-gray-300 py-1.5 px-3 text-base focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
        aria-label="Select Location"
      >
        <option value="">Select a location...</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>
            {loc.name} ({loc.market})
          </option>
        ))}
      </select>
    </div>
  );
}; 