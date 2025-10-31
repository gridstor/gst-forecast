import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const {
      curveDefinitionId,
      instanceVersion,
      deliveryPeriodStart,
      deliveryPeriodEnd,
      forecastRunDate,
      createdBy = 'Upload System',
      notes,
      modelType,
      // NEW: Multi-value arrays
      curveTypes = [],
      commodities = [],
      scenarios = [],
      granularity,
      degradationType,
      // Link to schedule/request
      linkedScheduleId
    } = body;

    // Validate required fields
    if (!curveDefinitionId || !instanceVersion || !deliveryPeriodStart || !deliveryPeriodEnd) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: curveDefinitionId, instanceVersion, deliveryPeriodStart, deliveryPeriodEnd' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate dates
    const startDate = new Date(deliveryPeriodStart);
    const endDate = new Date(deliveryPeriodEnd);
    const runDate = forecastRunDate ? new Date(forecastRunDate) : new Date();

    if (startDate >= endDate) {
      return new Response(
        JSON.stringify({ error: 'Delivery period start must be before end date' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if this instance version already exists for this curve definition
    const existingInstance = await prisma.curveInstance.findFirst({
      where: {
        curveDefinitionId: parseInt(curveDefinitionId),
        instanceVersion
      }
    });

    if (existingInstance) {
      return new Response(
        JSON.stringify({ 
          error: `Instance version '${instanceVersion}' already exists for this curve definition` 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build metadata
    const metadata: any = {};
    if (linkedScheduleId) {
      metadata.linkedScheduleId = parseInt(linkedScheduleId);
    }

    // Create the curve instance
    const curveInstance = await prisma.curveInstance.create({
      data: {
        curveDefinitionId: parseInt(curveDefinitionId),
        instanceVersion,
        deliveryPeriodStart: startDate,
        deliveryPeriodEnd: endDate,
        forecastRunDate: runDate,
        freshnessStartDate: runDate,
        status: 'DRAFT',
        runType: 'MANUAL',
        createdBy,
        notes,
        modelType,
        // NEW: Multi-value arrays
        curveTypes: Array.isArray(curveTypes) ? curveTypes : [],
        commodities: Array.isArray(commodities) ? commodities : [],
        scenarios: Array.isArray(scenarios) ? scenarios : [],
        granularity,
        degradationType,
        metadata: Object.keys(metadata).length > 0 ? metadata : null
      },
      include: {
        curveDefinition: true
      }
    });

    // If linked to a schedule, update the schedule run status
    if (linkedScheduleId) {
      try {
        const scheduleRuns = await prisma.scheduleRun.findMany({
          where: { scheduleId: parseInt(linkedScheduleId) },
          orderBy: { runDate: 'desc' },
          take: 1
        });
        
        if (scheduleRuns.length > 0) {
          await prisma.scheduleRun.update({
            where: { id: scheduleRuns[0].id },
            data: { 
              status: 'COMPLETED',
              completedAt: new Date(),
              instancesCreated: 1,
              metadata: { curveInstanceId: curveInstance.id }
            }
          });
        }
      } catch (error) {
        console.warn('Could not update schedule run status:', error);
        // Don't fail the instance creation if this fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        curveInstance
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating curve instance:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create curve instance',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}; 