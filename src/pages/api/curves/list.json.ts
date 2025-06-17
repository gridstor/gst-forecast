import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  try {
    const result = await query(`
      SELECT 
        cd.curve_id,
        cd.mark_type,
        cd.mark_case,
        cd.location,
        cd.market,
        cd.mark_date,
        cd.granularity,
        cd.curve_start_date,
        cd.curve_end_date,
        cd.curve_creator,
        cd.created_at,
        COUNT(pf.id) as price_points
      FROM curve_definitions cd
      LEFT JOIN price_forecasts pf ON cd.curve_id = pf.curve_id
      GROUP BY cd.curve_id, cd.mark_type, cd.mark_case, cd.location, cd.market, cd.mark_date, cd.granularity, cd.curve_start_date, cd.curve_end_date, cd.curve_creator, cd.created_at
      ORDER BY cd.mark_date DESC, cd.created_at DESC
    `);
    
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching curves:', error);
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