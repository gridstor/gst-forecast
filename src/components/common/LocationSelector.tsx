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
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Location
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full md:w-64 rounded-md border-gray-300"
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