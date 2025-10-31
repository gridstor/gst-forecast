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

    // Fetch curve data with new structure
    const result = await query(`
      SELECT 
        cd."timestamp",
        cd.value,
        cd."curveType",
        cd.commodity,
        cd.scenario,
        cd.units as data_units,
        ci.id as "instanceId",
        ci."instanceVersion",
        ci."curveTypes",
        ci.commodities,
        ci.granularity,
        ci.scenarios,
        ci."degradationType",
        def."curveName",
        def.location,
        def.market,
        def.units as def_units
      FROM "Forecasts"."CurveData" cd
      JOIN "Forecasts"."CurveInstance" ci ON cd."curveInstanceId" = ci.id
      JOIN "Forecasts"."CurveDefinition" def ON ci."curveDefinitionId" = def.id
      WHERE ci.id = ANY($1)
      ORDER BY cd."timestamp" ASC, cd."curveType", cd.commodity, cd.scenario
    `, [instanceIds]);

    const dataPoints = result.rows.map(row => ({
      timestamp: row.timestamp?.toISOString() ?? '',
      value: row.value ?? null,
      curveType: row.curveType,
      commodity: row.commodity,
      scenario: row.scenario,
      instanceId: row.instanceId,
      instanceVersion: row.instanceVersion,
      curveName: row.curveName,
      location: row.location,
      market: row.market,
      units: row.data_units || row.def_units,
      // Instance metadata:
      curveTypes: row.curveTypes || [],
      commodities: row.commodities || [],
      granularity: row.granularity,
      scenarios: row.scenarios || [],
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







