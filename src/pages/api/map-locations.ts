import type { APIRoute } from 'astro';
import { query } from '../../lib/db';

export const GET: APIRoute = async () => {
  try {
    
    // Get all unique market/location combinations
    const locationsResult = await query(`
      SELECT DISTINCT 
        cd.market,
        cd.location,
        cd."batteryDuration"
      FROM "Forecasts"."CurveDefinition" cd
      WHERE cd.market IS NOT NULL 
        AND cd.location IS NOT NULL
        AND cd."isActive" = true
      ORDER BY cd.market, cd.location
    `);
    
    const locationCards = [];
    
    // For each location, get the best available curve data
    for (const loc of locationsResult.rows) {
      const { market, location, batteryDuration } = loc;
      
      // Query to get the best curve instance (GridStor P50 > ASCEND > Aurora)
      // Priority: GridStor with P50 > Other with P50 > GridStor Base > Other Base
      const instanceResult = await query(`
        SELECT 
          ci.id as "instanceId",
          ci."instanceVersion",
          ci."createdBy",
          ci.scenarios,
          cd."curveName",
          cd.id as "definitionId"
        FROM "Forecasts"."CurveInstance" ci
        INNER JOIN "Forecasts"."CurveDefinition" cd 
          ON ci."curveDefinitionId" = cd.id
        WHERE cd.market = $1 
          AND cd.location = $2
          AND ci.status = 'ACTIVE'
          AND cd."isActive" = true
        ORDER BY 
          CASE 
            WHEN ci."createdBy" ILIKE '%gridstor%' 
              AND (ci.scenarios && ARRAY['P50', 'P5']::text[])
            THEN 1
            WHEN ci.scenarios && ARRAY['P50', 'P5']::text[] THEN 2
            WHEN ci."createdBy" ILIKE '%gridstor%' THEN 3
            WHEN ci."createdBy" ILIKE '%ascend%' THEN 4
            ELSE 5
          END,
          ci."createdAt" DESC
        LIMIT 1
      `, [market, location]);
      
      if (instanceResult.rows.length === 0) continue;
      
      const instance = instanceResult.rows[0];
      
      // Get P50 values for EA Revenue, AS Revenue, and Capacity (if available)
      const dataResult = await query(`
        SELECT 
          cf.commodity,
          AVG(cf.value) as avg_value
        FROM "Forecasts"."CurveData" cf
        WHERE cf."curveInstanceId" = $1
          AND cf.scenario IN ('P50', 'Base')
          AND cf.commodity IN ('EA Revenue', 'AS Revenue', 'Capacity Revenue', 'Total Revenue')
        GROUP BY cf.commodity
      `, [instance.instanceId]);
      
      // Extract values
      let energyArbitrage = 0;
      let ancillaryServices = 0;
      let capacity = 0;
      
      for (const row of dataResult.rows) {
        const value = parseFloat(row.avg_value) || 0;
        if (row.commodity === 'EA Revenue') {
          energyArbitrage = value;
        } else if (row.commodity === 'AS Revenue') {
          ancillaryServices = value;
        } else if (row.commodity === 'Capacity Revenue') {
          capacity = value;
        }
      }
      
      // Determine curve source label
      let curveSource = 'Base Forecast';
      if (instance.createdBy) {
        if (instance.createdBy.toLowerCase().includes('gridstor')) {
          curveSource = (instance.scenarios?.includes('P50') || instance.scenarios?.includes('P5')) 
            ? 'GridStor P50' 
            : 'GridStor Base';
        } else if (instance.createdBy.toLowerCase().includes('ascend')) {
          curveSource = 'ASCEND Forecast';
        } else if (instance.createdBy.toLowerCase().includes('aurora')) {
          curveSource = 'Aurora Base';
        }
      }
      
      // Create card data
      locationCards.push({
        id: `${market}_${location}`.toLowerCase().replace(/\s+/g, '_'),
        name: location,
        market: market,
        region: location,
        location: location,
        curves: {
          energyArbitrage: energyArbitrage,
          ancillaryServices: ancillaryServices,
          capacity: capacity
        },
        curveSource: curveSource,
        metadata: {
          dbLocationName: location,
          batteryDuration: batteryDuration,
          instanceId: instance.instanceId
        }
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: locationCards,
        count: locationCards.length
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Error fetching map locations:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

