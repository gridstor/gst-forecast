import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ url }) => {
  try {
    const definitionId = url.searchParams.get('definitionId');
    
    if (!definitionId) {
      return new Response(
        JSON.stringify({ error: 'definitionId parameter is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const definitionIdNum = parseInt(definitionId);
    if (isNaN(definitionIdNum)) {
      return new Response(
        JSON.stringify({ error: `Invalid definitionId: ${definitionId}` }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching instances for definitionId: ${definitionIdNum}`);

    const instances = await prisma.curveInstance.findMany({
      where: {
        curveDefinitionId: definitionIdNum
      },
      select: {
        id: true,
        instanceVersion: true,
        status: true,
        deliveryPeriodStart: true,
        deliveryPeriodEnd: true,
        forecastRunDate: true,
        createdAt: true,
        createdBy: true,
        notes: true,
        modelType: true,
        metadata: true,
        // Array fields for template generation
        curveTypes: true,
        commodities: true,
        scenarios: true,
        granularity: true,
        degradationType: true,
        curveDefinition: {
          select: {
            curveName: true,
            market: true,
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${instances.length} instances for definitionId ${definitionIdNum}`);

    return new Response(
      JSON.stringify({ instances }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching curve instances:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack, definitionId: url.searchParams.get('definitionId') });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch curve instances',
        details: errorMessage,
        definitionId: url.searchParams.get('definitionId')
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
