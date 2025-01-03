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
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border-gray-300 text-sm"
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