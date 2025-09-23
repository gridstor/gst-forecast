import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const instances = await prisma.curveInstance.findMany({
      where: {
        curveDefinitionId: parseInt(definitionId)
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

    return new Response(
      JSON.stringify({ instances }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching curve instances:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch curve instances' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } finally {
    await prisma.$disconnect();
  }
};
