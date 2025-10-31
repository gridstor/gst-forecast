import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async () => {
  try {
    // Get unique values from existing instances
    const result = await query(`
      SELECT 
        ARRAY_AGG(DISTINCT unnest_types) FILTER (WHERE unnest_types IS NOT NULL) as curve_types,
        ARRAY_AGG(DISTINCT unnest_commodities) FILTER (WHERE unnest_commodities IS NOT NULL) as commodities,
        ARRAY_AGG(DISTINCT unnest_scenarios) FILTER (WHERE unnest_scenarios IS NOT NULL) as scenarios,
        ARRAY_AGG(DISTINCT granularity) FILTER (WHERE granularity IS NOT NULL) as granularities,
        ARRAY_AGG(DISTINCT "degradationType") FILTER (WHERE "degradationType" IS NOT NULL) as degradation_types
      FROM (
        SELECT 
          unnest("curveTypes") as unnest_types,
          unnest("commodities") as unnest_commodities,
          unnest("scenarios") as unnest_scenarios,
          granularity,
          "degradationType"
        FROM "Forecasts"."CurveInstance"
      ) subquery;
    `);

    const row = result.rows[0] || {};
    
    // Combine with default options
    const options = {
      curveTypes: [...new Set([
        'P-Values',
        'Revenue Forecast',
        'Price Forecast',
        'Energy Arbitrage',
        ...(row.curve_types || [])
      ])].sort(),
      
      commodities: [...new Set([
        'Total Revenue',
        'EA Revenue',
        'AS Revenue',
        'Energy',
        'Capacity',
        'REC',
        ...(row.commodities || [])
      ])].sort(),
      
      scenarios: [...new Set([
        'BASE',
        'HIGH',
        'LOW',
        'P50',
        'P75',
        'P90',
        'P95',
        ...(row.scenarios || [])
      ])].sort(),
      
      granularities: [...new Set([
        'HOURLY',
        'DAILY',
        'MONTHLY',
        'QUARTERLY',
        'ANNUAL',
        ...(row.granularities || [])
      ])].filter(Boolean).sort(),
      
      degradationTypes: [...new Set([
        'NONE',
        'YEAR_1',
        'YEAR_5',
        'YEAR_10',
        'YEAR_15',
        'YEAR_20',
        ...(row.degradation_types || [])
      ])].filter(Boolean).sort()
    };

    return new Response(JSON.stringify({
      success: true,
      options
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error fetching options:', error);
    
    // Return default options on error
    return new Response(JSON.stringify({
      success: true,
      options: {
        curveTypes: ['P-Values', 'Revenue Forecast', 'Price Forecast'],
        commodities: ['Total Revenue', 'EA Revenue', 'AS Revenue'],
        scenarios: ['BASE', 'HIGH', 'LOW'],
        granularities: ['HOURLY', 'DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'],
        degradationTypes: ['NONE', 'YEAR_1', 'YEAR_5', 'YEAR_10', 'YEAR_15', 'YEAR_20']
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


