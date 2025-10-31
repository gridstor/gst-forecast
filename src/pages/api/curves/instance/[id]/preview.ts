import type { APIRoute } from 'astro';
import { query } from '../../../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  try {
    const instanceId = parseInt(params.id as string);
    
    if (isNaN(instanceId)) {
      return new Response(JSON.stringify({ error: 'Invalid instance ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch the first 5 rows of curve data (new structure)
    const result = await query(`
      SELECT 
        cd."timestamp",
        cd.value,
        cd."curveType",
        cd.commodity,
        cd.scenario,
        cd.units as data_units,
        def.units as def_units
      FROM "Forecasts"."CurveData" cd
      JOIN "Forecasts"."CurveInstance" ci ON cd."curveInstanceId" = ci.id
      JOIN "Forecasts"."CurveDefinition" def ON ci."curveDefinitionId" = def.id
      WHERE ci.id = $1
      ORDER BY cd."timestamp" ASC, cd."curveType", cd.commodity, cd.scenario
      LIMIT 5
    `, [instanceId]);

    const previewData = result.rows.map(row => ({
      timestamp: row.timestamp?.toISOString() ?? '',
      value: row.value,
      curveType: row.curveType,
      commodity: row.commodity,
      scenario: row.scenario,
      units: row.data_units || row.def_units || '$/MWh'
    }));

    return new Response(JSON.stringify({
      success: true,
      data: previewData,
      count: previewData.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error fetching curve preview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

