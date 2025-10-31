import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('Fetching curves from Forecasts.CurveDefinition table...');
    
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
      WHERE "isActive" = true
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${result.rows.length} curves`);
    
    return new Response(JSON.stringify({
      success: true,
      count: result.rows.length,
      data: result.rows
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching curves:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}; 