import type { APIRoute } from 'astro';
import { query } from '../../../../../lib/db';

export const PUT: APIRoute = async ({ params, request }) => {
  const curveId = params.curveId;
  const pointId = params.pointId;

  if (!curveId || !pointId || isNaN(parseInt(curveId)) || isNaN(parseInt(pointId))) {
    return new Response(JSON.stringify({ error: 'Invalid curve ID or point ID' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const body = await request.json();
    
    if (typeof body.value !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid value provided' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const result = await query(`
      UPDATE "Forecasts".price_forecasts
      SET value = $1
      WHERE id = $2 AND curve_id = $3
      RETURNING id, curve_id, flow_date_start, value
    `, [body.value, parseInt(pointId), parseInt(curveId)]);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Price point not found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: unknown) {
    console.error('Error updating price point:', error);
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

// Handle preflight requests for CORS
export const OPTIONS: APIRoute = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}; 