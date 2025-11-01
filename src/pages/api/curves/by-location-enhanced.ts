import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const market = url.searchParams.get('market');
    const location = url.searchParams.get('location');

    if (!market || !location) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: market and location' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get curve definitions with their BEST instances
    // Priority: GridStor + P-values > Any + P-values > GridStor > Most Recent
    const result = await query(`
      WITH RankedInstances AS (
        SELECT 
          ci.id as "instanceId",
          ci."curveDefinitionId",
          ci."instanceVersion",
          ci.status,
          ci."createdAt",
          ci."createdBy",
          ci."curveTypes",
          ci.commodities,
          ci.granularity,
          ci.scenarios,
          ci."degradationType",
          -- Scoring for best instance
          CASE
            WHEN ci."createdBy" ILIKE '%gridstor%' 
              AND (ci.scenarios && ARRAY['P5', 'P50', 'P95']::text[] OR ci.scenarios && ARRAY['P05', 'P50', 'P95']::text[])
            THEN 4  -- GridStor + P-values (BEST)
            WHEN (ci.scenarios && ARRAY['P5', 'P50', 'P95']::text[] OR ci.scenarios && ARRAY['P05', 'P50', 'P95']::text[])
            THEN 3  -- P-values (any source)
            WHEN ci."createdBy" ILIKE '%gridstor%'
            THEN 2  -- GridStor (no P-values)
            ELSE 1  -- Other
          END as priority_score,
          ROW_NUMBER() OVER (
            PARTITION BY ci."curveDefinitionId" 
            ORDER BY 
              CASE
                WHEN ci."createdBy" ILIKE '%gridstor%' 
                  AND (ci.scenarios && ARRAY['P5', 'P50', 'P95']::text[] OR ci.scenarios && ARRAY['P05', 'P50', 'P95']::text[])
                THEN 4
                WHEN (ci.scenarios && ARRAY['P5', 'P50', 'P95']::text[] OR ci.scenarios && ARRAY['P05', 'P50', 'P95']::text[])
                THEN 3
                WHEN ci."createdBy" ILIKE '%gridstor%'
                THEN 2
                ELSE 1
              END DESC,
              ci."createdAt" DESC
          ) as rn
        FROM "Forecasts"."CurveInstance" ci
        WHERE ci.status = 'ACTIVE'
      ),
      LatestInstances AS (
        SELECT * FROM RankedInstances WHERE rn = 1
      )
      SELECT 
        cd.id as "definitionId",
        cd."curveName",
        cd.market,
        cd.location,
        cd."batteryDuration",
        cd.units,
        cd.timezone,
        cd.description,
        li."instanceId",
        li."instanceVersion",
        li.status,
        li."createdAt" as "instanceCreatedAt",
        li."createdBy",
        li."curveTypes",
        li.commodities,
        li.granularity,
        li.scenarios,
        li."degradationType"
      FROM "Forecasts"."CurveDefinition" cd
      LEFT JOIN LatestInstances li ON cd.id = li."curveDefinitionId"
      WHERE cd.market = $1 
        AND cd.location = $2
        AND cd."isActive" = true
      ORDER BY cd."createdAt" DESC
    `, [market, location]);

    const curves = result.rows.map(row => ({
      definitionId: row.definitionId,
      curveName: row.curveName,
      market: row.market,
      location: row.location,
      batteryDuration: row.batteryDuration,
      units: row.units,
      timezone: row.timezone,
      description: row.description,
      latestInstance: row.instanceId ? {
        instanceId: row.instanceId,
        instanceVersion: row.instanceVersion,
        status: row.status,
        createdAt: row.instanceCreatedAt,
        createdBy: row.createdBy,
        // These are now arrays on instance level:
        curveTypes: row.curveTypes || [],
        commodities: row.commodities || [],
        granularity: row.granularity,
        scenarios: row.scenarios || [],
        degradationType: row.degradationType
      } : null
    }));

    return new Response(JSON.stringify(curves), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching curves by location:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch curves',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};







