import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      id,
      curveName,
      market,
      location,
      product,
      curveType,
      batteryDuration,
      scenario,
      granularity,
      description,
      updatedBy = 'Admin System'
    } = body;

    // Validate required fields
    if (!id || !curveName || !market || !location || !product || !curveType) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: id, curveName, market, location, product, curveType' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if the curve definition exists
    const existingDefinition = await prisma.curveDefinition.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDefinition) {
      return new Response(
        JSON.stringify({ error: 'Curve definition not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the curve definition
    const updatedDefinition = await prisma.curveDefinition.update({
      where: { id: parseInt(id) },
      data: {
        curveName,
        market,
        location,
        product,
        curveType,
        batteryDuration: batteryDuration || 'UNKNOWN',
        scenario: scenario || 'BASE',
        granularity: granularity || 'MONTHLY',
        description,
        updatedAt: new Date()
      }
    });

    // Log the change
    await logCurveActivity({
      action: 'UPDATE_DEFINITION',
      curveDefinitionId: parseInt(id),
      details: {
        oldValues: {
          curveName: existingDefinition.curveName,
          market: existingDefinition.market,
          location: existingDefinition.location,
          product: existingDefinition.product,
          curveType: existingDefinition.curveType
        },
        newValues: {
          curveName,
          market,
          location,
          product,
          curveType
        }
      },
      performedBy: updatedBy
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Curve definition updated successfully',
        curveDefinition: updatedDefinition
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating curve definition:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update curve definition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, performedBy = 'Admin System' } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Curve definition ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get definition details before deletion for logging
    const definitionToDelete = await prisma.curveDefinition.findUnique({
      where: { id: parseInt(id) },
      include: {
        instances: {
          include: {
            _count: {
              select: { priceForecasts: true }
            }
          }
        },
        schedules: true,
        defaultInputs: true
      }
    });

    if (!definitionToDelete) {
      return new Response(
        JSON.stringify({ error: 'Curve definition not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total data points that will be deleted
    const totalDataPoints = definitionToDelete.instances.reduce(
      (sum, instance) => sum + instance._count.priceForecasts, 0
    );

    // Count delivery requests (from raw SQL table)
    const deliveryRequestCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Forecasts"."CurveDeliveryRequest" 
      WHERE "curveDefinitionId" = ${parseInt(id)}
    `;
    const deliveryRequests = Number(deliveryRequestCount[0]?.count || 0);

    // Start transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Step 1: Delete all price forecasts for all instances
      for (const instance of definitionToDelete.instances) {
        await tx.priceForecast.deleteMany({
          where: { curveInstanceId: instance.id }
        });
      }

      // Step 2: Delete all curve instances
      await tx.curveInstance.deleteMany({
        where: { curveDefinitionId: parseInt(id) }
      });

      // Step 3: Delete any curve schedules that reference this definition
      await tx.curveSchedule.deleteMany({
        where: { curveDefinitionId: parseInt(id) }
      });

      // Step 4: Delete any other related records
      // Delete default inputs if they exist
      if (definitionToDelete.defaultInputs) {
        await tx.defaultCurveInput.deleteMany({
          where: { curveDefinitionId: parseInt(id) }
        });
      }

      // Step 5: Delete delivery-related records (created via raw SQL)
      // First delete delivery specs that reference delivery requests
      await tx.$executeRaw`
        DELETE FROM "Forecasts"."CurveDeliverySpec" 
        WHERE "deliveryRequestId" IN (
          SELECT "id" FROM "Forecasts"."CurveDeliveryRequest" 
          WHERE "curveDefinitionId" = ${parseInt(id)}
        )
      `;

      // Then delete delivery requests that reference this curve definition
      await tx.$executeRaw`
        DELETE FROM "Forecasts"."CurveDeliveryRequest" 
        WHERE "curveDefinitionId" = ${parseInt(id)}
      `;

      // Step 6: Finally delete the curve definition
      await tx.curveDefinition.delete({
        where: { id: parseInt(id) }
      });
    });

    // Log the deletion
    await logCurveActivity({
      action: 'DELETE_DEFINITION',
      curveDefinitionId: parseInt(id),
      details: {
        deletedDefinition: {
          curveName: definitionToDelete.curveName,
          market: definitionToDelete.market,
          location: definitionToDelete.location,
          instanceCount: definitionToDelete.instances.length,
          scheduleCount: definitionToDelete.schedules?.length || 0,
          defaultInputCount: definitionToDelete.defaultInputs?.length || 0,
          deliveryRequestCount: deliveryRequests,
          totalDataPoints
        }
      },
      performedBy
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully deleted curve definition '${definitionToDelete.curveName}' with ${definitionToDelete.instances.length} instances, ${definitionToDelete.schedules?.length || 0} schedules, ${deliveryRequests} delivery requests, and ${totalDataPoints} data points`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deleting curve definition:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete curve definition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
};

// Helper function to log curve activities
async function logCurveActivity({
  action,
  curveDefinitionId,
  curveInstanceId,
  details,
  performedBy
}: {
  action: string;
  curveDefinitionId?: number;
  curveInstanceId?: number;
  details: any;
  performedBy: string;
}) {
  try {
    // For now, we'll use a simple console log and could extend to database logging later
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      curveDefinitionId,
      curveInstanceId,
      details,
      performedBy
    };
    
    console.log('Curve Activity Log:', JSON.stringify(logEntry, null, 2));
    
    // Future: Insert into a CurveActivityLog table
    // await prisma.curveActivityLog.create({ data: logEntry });
    
  } catch (error) {
    console.error('Failed to log curve activity:', error);
  }
}
