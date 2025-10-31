import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const instance = await prisma.curveInstance.findUnique({
      where: { id: parseInt(id) },
      include: {
        curveDefinition: {
          select: {
            id: true,
            curveName: true,
            market: true,
            location: true
          }
        },
        priceForecasts: {
          select: { id: true }
        }
      }
    });

    if (!instance) {
      return new Response(JSON.stringify({ error: 'Instance not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      ...instance,
      dataPointCount: instance.priceForecasts.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching instance:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      id,
      instanceVersion,
      deliveryPeriodStart,
      deliveryPeriodEnd,
      forecastRunDate,
      freshnessStartDate,
      freshnessEndDate,
      status,
      modelType,
      modelVersion,
      runType,
      createdBy,
      approvedBy,
      approvedAt,
      notes,
      metadata,
      performedBy,
      // NEW: Multi-value arrays
      curveTypes,
      commodities,
      scenarios,
      granularity,
      degradationType
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update data object - only include fields that were provided
    const updateData: any = {
      updatedAt: new Date()
    };

    if (instanceVersion !== undefined) updateData.instanceVersion = instanceVersion;
    if (deliveryPeriodStart !== undefined) updateData.deliveryPeriodStart = new Date(deliveryPeriodStart);
    if (deliveryPeriodEnd !== undefined) updateData.deliveryPeriodEnd = new Date(deliveryPeriodEnd);
    if (forecastRunDate !== undefined) updateData.forecastRunDate = new Date(forecastRunDate);
    if (freshnessStartDate !== undefined) updateData.freshnessStartDate = new Date(freshnessStartDate);
    if (freshnessEndDate !== undefined) updateData.freshnessEndDate = freshnessEndDate ? new Date(freshnessEndDate) : null;
    if (status !== undefined) updateData.status = status;
    if (modelType !== undefined) updateData.modelType = modelType;
    if (modelVersion !== undefined) updateData.modelVersion = modelVersion;
    if (runType !== undefined) updateData.runType = runType;
    if (createdBy !== undefined) updateData.createdBy = createdBy;
    if (approvedBy !== undefined) updateData.approvedBy = approvedBy;
    if (approvedAt !== undefined) updateData.approvedAt = approvedAt ? new Date(approvedAt) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (metadata !== undefined) updateData.metadata = metadata;
    // NEW: Multi-value arrays
    if (curveTypes !== undefined) updateData.curveTypes = curveTypes;
    if (commodities !== undefined) updateData.commodities = commodities;
    if (scenarios !== undefined) updateData.scenarios = scenarios;
    if (granularity !== undefined) updateData.granularity = granularity;
    if (degradationType !== undefined) updateData.degradationType = degradationType;

    const updated = await prisma.curveInstance.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating instance:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ 
      error: 'Failed to update instance',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { instanceId } = body;

    if (!instanceId) {
      return new Response(JSON.stringify({ error: 'Missing instanceId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // This will cascade delete all price forecasts and data
    await prisma.curveInstance.delete({
      where: { id: parseInt(instanceId) }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting instance:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ 
      error: 'Failed to delete instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

