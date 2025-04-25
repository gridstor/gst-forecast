import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const DELETE: APIRoute = async ({ params }) => {
  const curveId = parseInt(params.id || '');

  if (isNaN(curveId)) {
    return new Response(JSON.stringify({ error: 'Invalid curve ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Delete price forecasts first (due to foreign key constraint)
    await query(
      'DELETE FROM "Forecasts".price_forecasts WHERE curve_id = $1',
      [curveId]
    );

    // Delete curve definition
    await query(
      'DELETE FROM "Forecasts".curve_definitions WHERE curve_id = $1',
      [curveId]
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 