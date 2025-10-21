import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async () => {
  try {
    // Get unique locations from CurveDefinition table
    const result = await query(`
      SELECT DISTINCT 
        location,
        market
      FROM "Forecasts"."CurveDefinition"
      WHERE "isActive" = true
      ORDER BY location ASC
    `);

    const locations = result.rows.map(row => ({
      id: `${row.market}-${row.location}`,
      name: `${row.market} - ${row.location}`,
      market: row.market,
      location: row.location
    }));

    return new Response(JSON.stringify(locations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



