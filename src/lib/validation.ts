import type { Granularity, CurveDefinition, CurveData } from './types';

export function validateGranularity(value: unknown): value is Granularity {
  return typeof value === 'string' && ['monthly', 'annual'].includes(value.toLowerCase());
}

export function validateCurveData(data: unknown): data is CurveData[] {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => 
    typeof item === 'object' &&
    item !== null &&
    'date' in item &&
    'value' in item &&
    typeof item.date === 'string' &&
    typeof item.value === 'number'
  );
}

export function validateCurveDefinition(curve: unknown): curve is CurveDefinition {
  if (typeof curve !== 'object' || curve === null) return false;
  
  const c = curve as any;
  return (
    typeof c.curve_id === 'number' &&
    typeof c.market === 'string' &&
    typeof c.location === 'string' &&
    typeof c.mark_case === 'string' &&
    c.mark_date instanceof Date &&
    typeof c.mark_type === 'string' &&
    validateGranularity(c.granularity) &&
    typeof c.is_default === 'boolean'
  );
} 