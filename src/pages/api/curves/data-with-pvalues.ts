import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const instanceIdsParam = url.searchParams.get('instanceIds');
    
    if (!instanceIdsParam) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: instanceIds' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const instanceIds = instanceIdsParam.split(',').map(Number);

    // First check if any instances exist
    const instanceCheck = await query(`
      SELECT id FROM "Forecasts"."CurveInstance"
      WHERE id = ANY($1)
    `, [instanceIds]);
    
    if (instanceCheck.rows.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch curve data with all p-values (CurveData has pivoted columns)
    const result = await query(`
      SELECT 
        cd."timestamp",
        cd."valueP5",
        cd."valueP25",
        cd."valueP50",
        cd."valueP75",
        cd."valueP95",
        ci.id as "instanceId",
        ci."instanceVersion",
        ci."curveType",
        ci.commodity,
        ci.granularity,
        ci.scenario,
        ci."degradationType",
        def."curveName",
        def.location,
        def.market,
        def.units
      FROM "Forecasts"."CurveData" cd
      JOIN "Forecasts"."CurveInstance" ci ON cd."curveInstanceId" = ci.id
      JOIN "Forecasts"."CurveDefinition" def ON ci."curveDefinitionId" = def.id
      WHERE ci.id = ANY($1)
      ORDER BY cd."timestamp" ASC, ci.id
    `, [instanceIds]);

    const dataPoints = result.rows.map(row => ({
      timestamp: row.timestamp?.toISOString() ?? '',
      valueP5: row.valueP5 ?? null,
      valueP25: row.valueP25 ?? null,
      valueP50: row.valueP50 ?? null,
      valueP75: row.valueP75 ?? null,
      valueP95: row.valueP95 ?? null,
      instanceId: row.instanceId,
      instanceVersion: row.instanceVersion,
      curveName: row.curveName,
      location: row.location,
      market: row.market,
      units: row.units,
      // These are now from instance:
      curveType: row.curveType,
      commodity: row.commodity,
      granularity: row.granularity,
      scenario: row.scenario,
      degradationType: row.degradationType
    }));

    return new Response(JSON.stringify(dataPoints), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching curve data with p-values:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch curve data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};







