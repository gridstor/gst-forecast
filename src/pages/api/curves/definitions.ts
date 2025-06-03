import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get all active curve definitions
    const definitions = await prisma.curveDefinition.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        curveName: true,
        market: true,
        location: true,
        product: true,
        curveType: true,
        batteryDuration: true,
        scenario: true,
        degradationType: true,
        commodity: true,
        units: true,
        description: true,
        createdAt: true,
        // Include count of existing instances
        _count: {
          select: {
            instances: true
          }
        }
      },
      orderBy: [
        { market: 'asc' },
        { location: 'asc' },
        { product: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform data for frontend consumption
    const formattedDefinitions = definitions.map(def => ({
      id: def.id,
      curveName: def.curveName,
      market: def.market,
      location: def.location,
      product: def.product,
      curveType: def.curveType,
      batteryDuration: def.batteryDuration,
      scenario: def.scenario,
      degradationType: def.degradationType,
      commodity: def.commodity,
      units: def.units,
      description: def.description,
      instanceCount: def._count.instances,
      displayName: `${def.market} ${def.location} ${def.product} ${def.curveType} (${def.batteryDuration}, ${def.scenario})`,
      createdAt: def.createdAt
    }));

    return new Response(
      JSON.stringify(formattedDefinitions),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching curve definitions:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load curve definitions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}; 