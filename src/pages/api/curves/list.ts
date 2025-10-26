import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Get all curve instances with their definition data
    const instances = await prisma.curveInstance.findMany({
      include: {
        curveDefinition: {
          select: {
            curveName: true,
            market: true,
            location: true,
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the data for the dropdown
    const curves = instances.map(instance => ({
      id: instance.id,
      curveName: instance.curveDefinition.curveName,
      market: instance.curveDefinition.market,
      location: instance.curveDefinition.location,
      // All these are now on instance level:
      curveType: instance.curveType,
      commodity: instance.commodity,
      granularity: instance.granularity,
      scenario: instance.scenario,
      degradationType: instance.degradationType,
      instanceVersion: instance.instanceVersion,
      createdBy: instance.createdBy,
      createdAt: instance.createdAt
    }));

    return new Response(JSON.stringify({ 
      success: true,
      curves,
      total: curves.length 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching curve instances:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to fetch curve instances',
      curves: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
