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

    // Get ALL instances for this market+location (not just latest)
    const result = await query(`
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
        cd."curveName",
        cd.market,
        cd.location,
        cd."batteryDuration",
        cd.units,
        -- Check for P-values
        CASE 
          WHEN ci.scenarios && ARRAY['P5', 'P50', 'P95']::text[] OR ci.scenarios && ARRAY['P05', 'P50', 'P95']::text[]
          THEN true
          ELSE false
        END as "hasPValues"
      FROM "Forecasts"."CurveInstance" ci
      JOIN "Forecasts"."CurveDefinition" cd ON ci."curveDefinitionId" = cd.id
      WHERE cd.market = $1 
        AND cd.location = $2
        AND ci.status = 'ACTIVE'
      ORDER BY 
        -- GridStor + P-values first
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
    `, [market, location]);

    const instances = result.rows.map(row => ({
      instanceId: row.instanceId,
      definitionId: row.curveDefinitionId,
      instanceVersion: row.instanceVersion,
      curveName: row.curveName,
      market: row.market,
      location: row.location,
      batteryDuration: row.batteryDuration,
      units: row.units,
      status: row.status,
      createdAt: row.createdAt,
      createdBy: row.createdBy,
      curveTypes: row.curveTypes || [],
      commodities: row.commodities || [],
      scenarios: row.scenarios || [],
      granularity: row.granularity,
      degradationType: row.degradationType,
      hasPValues: row.hasPValues
    }));

    return new Response(JSON.stringify({ 
      instances,
      total: instances.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching all instances for location:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch instances',
      details: error instanceof Error ? error.message : 'Unknown error',
      instances: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

