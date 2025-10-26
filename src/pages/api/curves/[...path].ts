import type { APIRoute } from 'astro';
import { query, getClient } from '../../../lib/db';

export const get: APIRoute = async ({ params, request }) => {
  const path = params.path?.split('/') || [];

  try {
    // List all curves
    if (path[0] === 'list') {
      const result = await query(`
        SELECT 
          cd.id as curve_id,
          cd."curveName" as curve_name,
          cd.market,
          cd.location,
          cd."createdAt" as created_at,
          COUNT(ci.id) as instance_count
        FROM "Forecasts"."CurveDefinition" cd
        LEFT JOIN "Forecasts"."CurveInstance" ci ON cd.id = ci."curveDefinitionId"
        WHERE cd."isActive" = true
        GROUP BY cd.id, cd."curveName", cd.market, cd.location, cd."createdAt"
        ORDER BY cd."createdAt" DESC
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

      const result = await query(`
        SELECT pf.id, pf."curveInstanceId", pf.timestamp, pf.value
        FROM "Forecasts"."PriceForecast" pf
        JOIN "Forecasts"."CurveInstance" ci ON pf."curveInstanceId" = ci.id
        WHERE ci."curveDefinitionId" = $1
        ORDER BY pf.timestamp
      `, [curveId]);

      return new Response(JSON.stringify(result.rows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid endpoint');
  } catch (error: unknown) {
    console.error('Error in curves API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async (context) => {
  return get(context);
};

export const POST: APIRoute = async ({ params, request }) => {
  const path = params.path?.split('/') || [];

  try {
    if (path[0] === 'upload') {
      const data = await request.json();
      
      // Handle curve upload logic here
      console.log('Curve upload data:', data);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Curve uploaded successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid POST endpoint');
  } catch (error: unknown) {
    console.error('Error in curves POST API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  const path = params.path?.split('/') || [];

  try {
    if (path[0] && path[1] === 'update') {
      const curveId = parseInt(path[0]);
      if (isNaN(curveId)) {
        throw new Error('Invalid curve ID');
      }

      const data = await request.json();
      
      // Handle curve update logic here
      console.log('Curve update data:', { curveId, data });
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Curve updated successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid PUT endpoint');
  } catch (error: unknown) {
    console.error('Error in curves PUT API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const del: APIRoute = async ({ params, request }) => {
  const path = params.path?.split('/') || [];
  const curveId = parseInt(path[0]);

  if (isNaN(curveId)) {
    return new Response(JSON.stringify({ error: 'Invalid curve ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const client = await getClient();
  try {
    // Start transaction
    await client.query('BEGIN');

    // Delete price forecasts first (due to foreign key constraint)
    await client.query(
      'DELETE FROM "Forecasts"."PriceForecast" WHERE "curveInstanceId" IN (SELECT id FROM "Forecasts"."CurveInstance" WHERE "curveDefinitionId" = $1)',
      [curveId]
    );

    // Delete curve instances
    await client.query(
      'DELETE FROM "Forecasts"."CurveInstance" WHERE "curveDefinitionId" = $1',
      [curveId]
    );

    // Delete curve definition
    await client.query(
      'DELETE FROM "Forecasts"."CurveDefinition" WHERE id = $1',
      [curveId]
    );

    // Commit transaction
    await client.query('COMMIT');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    client.release(); // Release client back to pool, don't close the pool
  }
};

export const put: APIRoute = async ({ params, request }) => {
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
      
      await query(`
        UPDATE "Forecasts"."PriceForecast"
        SET value = $1
        WHERE id = $2
      `, [body.value, pointId]);

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
  }

  return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
};