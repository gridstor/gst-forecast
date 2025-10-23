import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const curveIds = searchParams.get('curves')?.split(',').map(Number) || [];
    const curveInstanceId = searchParams.get('curveInstanceId') ? Number(searchParams.get('curveInstanceId')) : null;
    const aggregation = searchParams.get('aggregation') || 'monthly';

    if (curveIds.length === 0 && !curveInstanceId) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result;
    
    if (curveInstanceId) {
      console.log(`Fetching curve data for instance ID: ${curveInstanceId}`);
      
      // Query by specific curve instance ID (CurveData) - TALL FORMAT with PIVOT
      // Using FILTER for conditional aggregation to pivot tall to wide format
      result = await query(`
        SELECT 
          cd."timestamp",
          cd."curveInstanceId",
          ci."curveDefinitionId" as curve_id,
          def."curveName" as curve_name,
          def.location,
          def.market,
          def."curveType" as curve_type,
          def."createdBy" as curve_creator,
          def.units,
          ci.metadata,
          MAX(cd.id) as id,
          MAX(cd.value) FILTER (WHERE cd."pValue" = 5) as "valueP5",
          MAX(cd.value) FILTER (WHERE cd."pValue" = 25) as "valueP25",
          MAX(cd.value) FILTER (WHERE cd."pValue" = 50) as "valueP50",
          MAX(cd.value) FILTER (WHERE cd."pValue" = 75) as "valueP75",
          MAX(cd.value) FILTER (WHERE cd."pValue" = 95) as "valueP95"
        FROM "Forecasts"."CurveData" cd
        JOIN "Forecasts"."CurveInstance" ci ON cd."curveInstanceId" = ci.id
        JOIN "Forecasts"."CurveDefinition" def ON ci."curveDefinitionId" = def.id
        WHERE ci.id = $1
        GROUP BY cd."timestamp", cd."curveInstanceId", ci."curveDefinitionId", 
                 def."curveName", def.location, def.market, def."curveType", 
                 def."createdBy", def.units, ci.metadata
        ORDER BY cd."timestamp" ASC
      `, [curveInstanceId]);
    } else {
      console.log(`Fetching curve data for definition IDs: ${curveIds.join(', ')}, aggregation: ${aggregation}`);
      
      // Query by curve definition IDs - TALL FORMAT
      // For general curve viewing, just get P50 values (or any available p-value)
      result = await query(`
        SELECT 
          pf.id,
          pf."timestamp",
          pf.value,
          pf."pValue",
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
        WHERE cd.id = ANY($1) AND pf."pValue" = 50
        ORDER BY pf."timestamp" ASC
      `, [curveIds]);
    }

    let responseData;
    
    if (curveInstanceId) {
      // Format for instance-specific queries (for admin preview)
      const priceData = result.rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp?.toISOString() ?? '',
        value: row.valueP50 ?? 0,
        valueP5: row.valueP5,
        valueP25: row.valueP25,
        valueP50: row.valueP50,
        valueP75: row.valueP75,
        valueP95: row.valueP95,
        pvalue: 50,
        units: row.units || ((row.metadata && (typeof row.metadata === 'object') && row.metadata.units) ? row.metadata.units : '$/MWh'),
        curveInstanceId: row.curveInstanceId
      }));
      
      responseData = {
        priceData,
        totalCount: priceData.length,
        curveInstance: {
          id: curveInstanceId,
          curveName: result.rows[0]?.curve_name,
          location: result.rows[0]?.location,
          market: result.rows[0]?.market
        }
      };
      
      console.log(`Found ${priceData.length} data points for instance ${curveInstanceId}`);
    } else {
      // Format for definition queries (for chart display)
      responseData = result.rows.map(row => ({
        date: row.timestamp?.toISOString() ?? '',
        value: row.value ?? 0,
        curveId: row.curve_id,
        curve_name: row.curve_name ?? '',
        location: row.location ?? '',
        market: row.market ?? '',
        curve_type: row.curve_type ?? '',
        curve_creator: row.curve_creator ?? ''
      }));
      
      console.log(`Found ${responseData.length} data points for ${curveIds.length} definition(s)`);
    }

    return new Response(JSON.stringify(responseData), {
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