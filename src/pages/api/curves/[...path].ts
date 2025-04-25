import type { APIRoute } from 'astro';
import { createDatabase } from '../../../lib/db';

export const get: APIRoute = async ({ params, request }) => {
  const db = await createDatabase();
  const path = params.path?.split('/') || [];

  try {
    // List all curves
    if (path[0] === 'list') {
      const result = await db.query(`
        SELECT 
          cd.curve_id,
          cd.mark_type,
          cd.location,
          cd.market,
          cd.mark_date,
          COUNT(pf.id) as price_points
        FROM "Forecasts".curve_definitions cd
        LEFT JOIN "Forecasts".price_forecasts pf ON cd.curve_id = pf.curve_id
        GROUP BY cd.curve_id, cd.mark_type, cd.location, cd.market, cd.mark_date
        ORDER BY cd.mark_date DESC
      `);
      
      return new Response(JSON.stringify(result.rows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get price points for a curve
    if (path[1] === 'prices') {
      const curveId = parseInt(path[0]);
      if (isNaN(curveId)) {
        throw new Error('Invalid curve ID');
      }

      const result = await db.query(`
        SELECT id, curve_id, flow_date_start, value
        FROM "Forecasts".price_forecasts
        WHERE curve_id = $1
        ORDER BY flow_date_start
      `, [curveId]);

      return new Response(JSON.stringify(result.rows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid endpoint');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await db.end();
  }
};

export const del: APIRoute = async ({ params, request }) => {
  const db = await createDatabase();
  const path = params.path?.split('/') || [];
  const curveId = parseInt(path[0]);

  if (isNaN(curveId)) {
    return new Response(JSON.stringify({ error: 'Invalid curve ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Start transaction
    await db.query('BEGIN');

    // Delete price forecasts first (due to foreign key constraint)
    await db.query(
      'DELETE FROM "Forecasts".price_forecasts WHERE curve_id = $1',
      [curveId]
    );

    // Delete curve definition
    await db.query(
      'DELETE FROM "Forecasts".curve_definitions WHERE curve_id = $1',
      [curveId]
    );

    // Commit transaction
    await db.query('COMMIT');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    await db.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await db.end();
  }
};

export const put: APIRoute = async ({ params, request }) => {
  const db = await createDatabase();
  const path = params.path?.split('/') || [];
  
  // Update price point
  if (path[1] === 'prices' && path[2]) {
    const curveId = parseInt(path[0]);
    const pointId = parseInt(path[2]);

    if (isNaN(curveId) || isNaN(pointId)) {
      return new Response(JSON.stringify({ error: 'Invalid ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      
      await db.query(`
        UPDATE "Forecasts".price_forecasts
        SET value = $1
        WHERE id = $2 AND curve_id = $3
      `, [body.value, pointId, curveId]);

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
    } finally {
      await db.end();
    }
  }

  return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}; 