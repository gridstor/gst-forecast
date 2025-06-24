import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const locationParam = new URL(url).searchParams.get('location');
    
    if (!locationParam) {
      return new Response(
        JSON.stringify({ error: 'Location parameter is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching curves for location: ${locationParam}`);
    
    const result = await query(`
      SELECT 
        id as curve_id,
        "curveName" as curve_name,
        market,
        location,
        product,
        "curveType" as curve_type,
        "batteryDuration" as battery_duration,
        scenario,
        "degradationType" as degradation_type,
        commodity,
        units,
        description,
        "isActive" as is_active,
        "createdAt" as created_at,
        "createdBy" as created_by
      FROM "Forecasts"."CurveDefinition"
      WHERE location = $1 AND "isActive" = true
      ORDER BY "createdAt" DESC
    `, [locationParam]);

    console.log(`Found ${result.rows.length} curves for location ${locationParam}`);

    return new Response(JSON.stringify(result.rows), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in curves by location API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch curves' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 