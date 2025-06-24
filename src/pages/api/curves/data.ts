import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const curveIds = searchParams.get('curves')?.split(',').map(Number) || [];
    const aggregation = searchParams.get('aggregation') || 'monthly';

    if (curveIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Fetching curve data for IDs: ${curveIds.join(', ')}, aggregation: ${aggregation}`);

    // Query the new Forecasts schema tables
    const result = await query(`
      SELECT 
        pf.id,
        pf."timestamp",
        pf.value,
        pf."curveInstanceId",
        ci."curveDefinitionId" as curve_id,
        cd."curveName" as curve_name,
        cd.location,
        cd.market,
        cd."curveType" as curve_type,
        cd."createdBy" as curve_creator
      FROM "Forecasts"."PriceForecast" pf
      JOIN "Forecasts"."CurveInstance" ci ON pf."curveInstanceId" = ci.id
      JOIN "Forecasts"."CurveDefinition" cd ON ci."curveDefinitionId" = cd.id
      WHERE cd.id = ANY($1)
      ORDER BY pf."timestamp" ASC
    `, [curveIds]);

    const formattedData = result.rows.map(row => ({
      date: row.timestamp?.toISOString() ?? '',
      value: row.value ?? 0,
      curveId: row.curve_id,
      curve_name: row.curve_name ?? '',
      location: row.location ?? '',
      market: row.market ?? '',
      curve_type: row.curve_type ?? '',
      curve_creator: row.curve_creator ?? ''
    }));

    console.log(`Found ${formattedData.length} data points for ${curveIds.length} curves`);

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching curve data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch curve data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 