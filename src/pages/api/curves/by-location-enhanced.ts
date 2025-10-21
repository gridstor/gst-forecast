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

    // Get curve definitions with their latest instances
    const result = await query(`
      WITH LatestInstances AS (
        SELECT DISTINCT ON (ci."curveDefinitionId")
          ci.id as "instanceId",
          ci."curveDefinitionId",
          ci."instanceVersion",
          ci.status,
          ci."createdAt",
          ci."createdBy"
        FROM "Forecasts"."CurveInstance" ci
        WHERE ci.status = 'ACTIVE'
        ORDER BY ci."curveDefinitionId", ci."createdAt" DESC
      )
      SELECT 
        cd.id as "definitionId",
        cd."curveName",
        cd.market,
        cd.location,
        cd.product,
        cd."curveType",
        cd."batteryDuration",
        cd.scenario,
        cd."degradationType",
        cd.commodity,
        cd.units,
        cd.granularity,
        cd.description,
        li."instanceId",
        li."instanceVersion",
        li.status,
        li."createdAt" as "instanceCreatedAt",
        li."createdBy"
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
      product: row.product,
      curveType: row.curveType,
      batteryDuration: row.batteryDuration,
      scenario: row.scenario,
      degradationType: row.degradationType,
      commodity: row.commodity,
      units: row.units,
      granularity: row.granularity,
      description: row.description,
      latestInstance: row.instanceId ? {
        instanceId: row.instanceId,
        instanceVersion: row.instanceVersion,
        status: row.status,
        createdAt: row.instanceCreatedAt,
        createdBy: row.createdBy
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

