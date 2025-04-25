import type { APIRoute } from 'astro';
import { query } from '../../../../lib/db';

export const GET: APIRoute = async ({ params, request }) => {
  const curveId = params.id;

  if (!curveId || isNaN(parseInt(curveId))) {
    return new Response(JSON.stringify({ error: 'Invalid curve ID' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const result = await query(`
      SELECT id, curve_id, flow_date_start, value
      FROM "Forecasts".price_forecasts
      WHERE curve_id = $1
      ORDER BY flow_date_start
    `, [parseInt(curveId)]);

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching price points:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}; 