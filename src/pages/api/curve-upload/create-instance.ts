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
      // NEW: Fields moved from CurveDefinition
      curveType,
      commodity,
      granularity,
      scenario,
      degradationType
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
        // NEW: Fields moved from CurveDefinition
        curveType,
        commodity,
        granularity,
        scenario,
        degradationType
      },
      include: {
        curveDefinition: true
      }
    });

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