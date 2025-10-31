import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/curves/definition/[id]/download
 * 
 * Returns complete data (not limited/sampled) for download purposes
 * Optionally filter to a specific instance with ?instanceId=X
 */
export const GET: APIRoute = async ({ params, url }) => {
  try {
    const definitionId = parseInt(params.id as string);
    const instanceIdParam = url.searchParams.get('instanceId');
    
    if (isNaN(definitionId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid definition ID' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build where clause for instances
    const instanceWhere: any = {
      curveDefinitionId: definitionId
    };
    
    // If specific instance requested, filter to that
    if (instanceIdParam) {
      instanceWhere.id = parseInt(instanceIdParam);
    }

    // Fetch the curve definition with complete data (no limits)
    const definition = await prisma.curveDefinition.findUnique({
      where: { id: definitionId },
      include: {
        instances: {
          where: instanceWhere,
          include: {
            curveData: {
              orderBy: {
                timestamp: 'asc'
              }
            },
            priceForecasts: {
              orderBy: [
                { timestamp: 'asc' },
                { pValue: 'asc' }
              ]
            },
            _count: {
              select: {
                curveData: true,
                priceForecasts: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!definition) {
      return new Response(JSON.stringify({ 
        error: 'Curve definition not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Format the response
    const response = {
      definition: {
        id: definition.id,
        curveName: definition.curveName,
        market: definition.market,
        location: definition.location,
        batteryDuration: definition.batteryDuration,
        units: definition.units,
        timezone: definition.timezone,
        description: definition.description,
        createdAt: definition.createdAt,
        updatedAt: definition.updatedAt
      },
      instances: definition.instances.map(instance => ({
        id: instance.id,
        instanceVersion: instance.instanceVersion,
        status: instance.status,
        curveTypes: instance.curveTypes,
        commodities: instance.commodities,
        scenarios: instance.scenarios,
        granularity: instance.granularity,
        degradationType: instance.degradationType,
        deliveryPeriodStart: instance.deliveryPeriodStart,
        deliveryPeriodEnd: instance.deliveryPeriodEnd,
        forecastRunDate: instance.forecastRunDate,
        createdBy: instance.createdBy,
        createdAt: instance.createdAt,
        totalDataPoints: instance._count.curveData,
        totalForecasts: instance._count.priceForecasts,
        curveData: instance.curveData.map(data => ({
          timestamp: data.timestamp,
          value: data.value,
          curveType: data.curveType,
          commodity: data.commodity,
          scenario: data.scenario,
          units: data.units
        })),
        priceForecasts: instance.priceForecasts.map(forecast => ({
          timestamp: forecast.timestamp,
          pValue: forecast.pValue,
          value: forecast.value
        }))
      }))
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-Total-Instances': definition.instances.length.toString(),
        'X-Total-Data-Points': definition.instances.reduce((sum, i) => sum + i._count.curveData, 0).toString()
      }
    });

  } catch (error) {
    console.error('Error fetching download data:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch curve data for download',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};
