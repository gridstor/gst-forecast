import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { instanceId, curveDefinitionId, instanceVersion } = body;

    // Validate input - need either instanceId or both curveDefinitionId + instanceVersion
    if (!instanceId && (!curveDefinitionId || !instanceVersion)) {
      return new Response(
        JSON.stringify({ 
          error: 'Must provide either instanceId OR both curveDefinitionId and instanceVersion' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let targetInstanceId = instanceId;

    // If we don't have instanceId, find it using curveDefinitionId + instanceVersion
    if (!targetInstanceId && curveDefinitionId && instanceVersion) {
      const instance = await prisma.curveInstance.findFirst({
        where: {
          curveDefinitionId: parseInt(curveDefinitionId),
          instanceVersion
        }
      });

      if (!instance) {
        return new Response(
          JSON.stringify({ 
            error: `No curve instance found with version '${instanceVersion}' for curve definition ${curveDefinitionId}` 
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      targetInstanceId = instance.id;
    }

    // Get instance details before deletion for response
    const instanceToDelete = await prisma.curveInstance.findUnique({
      where: { id: parseInt(targetInstanceId) },
      include: { 
        curveDefinition: {
          select: { curveName: true, market: true, location: true }
        }
      }
    });

    if (!instanceToDelete) {
      return new Response(
        JSON.stringify({ error: 'Curve instance not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Start transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete all price forecasts for this instance first
      const deletedForecasts = await tx.priceForecast.deleteMany({
        where: { curveInstanceId: parseInt(targetInstanceId) }
      });

      // Delete the curve instance
      await tx.curveInstance.delete({
        where: { id: parseInt(targetInstanceId) }
      });

      console.log(`Deleted curve instance ${targetInstanceId} and ${deletedForecasts.count} price forecasts`);
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully deleted curve instance '${instanceToDelete.instanceVersion}'`,
        deletedInstance: {
          id: instanceToDelete.id,
          instanceVersion: instanceToDelete.instanceVersion,
          curveName: instanceToDelete.curveDefinition.curveName,
          market: instanceToDelete.curveDefinition.market,
          location: instanceToDelete.curveDefinition.location
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deleting curve instance:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete curve instance',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const curveDefinitionId = searchParams.get('curveDefinitionId');

    if (!curveDefinitionId) {
      return new Response(
        JSON.stringify({ error: 'curveDefinitionId parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all instances for this curve definition
    const instances = await prisma.curveInstance.findMany({
      where: { curveDefinitionId: parseInt(curveDefinitionId) },
      include: {
        curveDefinition: {
          select: { curveName: true, market: true, location: true }
        },
        _count: {
          select: { priceForecasts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        instances: instances.map(instance => ({
          id: instance.id,
          instanceVersion: instance.instanceVersion,
          status: instance.status,
          granularity: instance.granularity,
          createdAt: instance.createdAt,
          createdBy: instance.createdBy,
          deliveryPeriodStart: instance.deliveryPeriodStart,
          deliveryPeriodEnd: instance.deliveryPeriodEnd,
          curveName: instance.curveDefinition.curveName,
          market: instance.curveDefinition.market,
          location: instance.curveDefinition.location,
          pricePointCount: instance._count.priceForecasts
        }))
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching curve instances:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch curve instances',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
};
