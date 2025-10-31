import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const {
      curveName,
      market,
      location,
      batteryDuration,
      units = '$/MWh',
      timezone = 'UTC',
      description,
      createdBy = 'Upload System'
    } = body;

    // Validate required fields (now much simpler!)
    if (!curveName || !market || !location) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: curveName, market, location' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Try to find existing curve definition first (by name + market + location)
    let curveDefinition = await prisma.curveDefinition.findFirst({
      where: {
        curveName,
        market,
        location
      }
    });

    // If not found, create new one
    if (!curveDefinition) {
      curveDefinition = await prisma.curveDefinition.create({
        data: {
          curveName,
          market,
          location,
          product: 'General', // Optional legacy field - kept for DB compatibility
          // curveType, commodity, granularity, scenario, degradationType moved to CurveInstance
          batteryDuration: batteryDuration || 'UNKNOWN',
          units,
          timezone,
          description,
          createdBy
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        curveDefinition,
        isNew: !curveDefinition.createdAt || new Date().getTime() - new Date(curveDefinition.createdAt).getTime() < 5000
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating curve definition:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create curve definition',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}; 