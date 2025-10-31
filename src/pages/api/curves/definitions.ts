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
        // product, curveType, commodity, granularity, scenario, degradationType all moved to instance level
        batteryDuration: true,
        units: true,
        timezone: true,
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
        { createdAt: 'desc' }
      ]
    });

    // Transform data for frontend consumption
    const formattedDefinitions = definitions.map(def => ({
      id: def.id,
      curveName: def.curveName,
      market: def.market,
      location: def.location,
      // product, curveType, commodity, granularity, scenario, degradationType are now on instances
      batteryDuration: def.batteryDuration,
      units: def.units,
      timezone: def.timezone,
      description: def.description,
      instanceCount: def._count.instances,
      displayName: `${def.market} ${def.location} - ${def.curveName}`,
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