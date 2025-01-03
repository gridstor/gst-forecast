import type { LocationOption, CurveData, CurveDefinition, Granularity } from './types';

// Locations
export async function fetchLocations(): Promise<LocationOption[]> {
  const response = await fetch('/api/locations');
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
}

// Curves
export async function fetchCurvesByLocation(location: string): Promise<CurveDefinition[]> {
  const response = await fetch(`/api/curves/by-location?location=${encodeURIComponent(location)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch curves');
  }
  return response.json();
}

export async function fetchDefaultCurves(location: string): Promise<{ monthly: number[], annual: number[] }> {
  const response = await fetch(`/api/curves/get-defaults?location=${encodeURIComponent(location)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch default curves');
  }
  return response.json();
}

export async function fetchCurveData(params: {
  curveIds: number[];
  aggregation: 'monthly' | 'annual';
}): Promise<CurveData[]> {
  const response = await fetch(`/api/curves/data?${new URLSearchParams({
    curves: params.curveIds.join(','),
    aggregation: params.aggregation
  })}`);
  if (!response.ok) {
    throw new Error('Failed to fetch curve data');
  }
  return response.json();
}

export async function setDefaultCurve(
  curveId: number, 
  isDefault: boolean, 
  displayOrder?: number
): Promise<{ success: boolean; isDefault: boolean }> {
  const response = await fetch('/api/curves/set-default', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curveId, isDefault, displayOrder })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to update curve');
  }

  return response.json();
}

export async function fetchCurveDefinitions(location: string, granularity: Granularity): Promise<CurveDefinition[]> {
  const response = await fetch(`/api/curves/definitions?location=${encodeURIComponent(location)}&granularity=${granularity}`);
  if (!response.ok) {
    throw new Error('Failed to fetch curve definitions');
  }
  return response.json();
} 