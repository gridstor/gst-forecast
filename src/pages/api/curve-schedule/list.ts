import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async () => {
  try {
    const schedules = await prisma.curveSchedule.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        scheduleType: true,
        frequency: true,
        curveDefinitionId: true,
        metadata: true,
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

    return new Response(JSON.stringify({
      success: true,
      schedules
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return new Response(JSON.stringify({
      success: false,
      schedules: [],
      message: error.message || 'Failed to fetch schedules'
    }), { status: 500 });
  }
};


