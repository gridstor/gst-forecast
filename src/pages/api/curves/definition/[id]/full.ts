import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/curves/definition/[id]/full
 * 
 * Returns a complete nested view of a curve definition with all its instances and data
 * Demonstrates the proper nesting: Definition -> Instances -> Data
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const definitionId = parseInt(params.id as string);
    
    if (isNaN(definitionId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid definition ID' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch the curve definition with all nested instances and their data
    const definition = await prisma.curveDefinition.findUnique({
      where: { id: definitionId },
      include: {
        instances: {
          include: {
            curveData: {
              take: 10, // Limit data points per instance for demo
              orderBy: {
                timestamp: 'asc'
              }
            },
            priceForecasts: {
              take: 10, // Limit price forecasts per instance for demo
              orderBy: {
                timestamp: 'asc'
              }
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
        },
        schedules: {
          where: {
            isActive: true
          }
        },
        _count: {
          select: {
            instances: true,
            schedules: true
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

    // Format the response to show the hierarchy clearly
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
        isActive: definition.isActive,
        createdAt: definition.createdAt,
        updatedAt: definition.updatedAt,
        counts: {
          totalInstances: definition._count.instances,
          activeSchedules: definition._count.schedules
        }
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
        counts: {
          totalCurveData: instance._count.curveData,
          totalPriceForecasts: instance._count.priceForecasts
        },
        sampleData: {
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
        }
      })),
      schedules: definition.schedules.map(schedule => ({
        id: schedule.id,
        scheduleType: schedule.scheduleType,
        frequency: schedule.frequency,
        responsibleTeam: schedule.responsibleTeam,
        isActive: schedule.isActive
      }))
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-Total-Instances': definition._count.instances.toString(),
        'X-Total-Schedules': definition._count.schedules.toString()
      }
    });

  } catch (error) {
    console.error('Error fetching full curve definition:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch curve definition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

