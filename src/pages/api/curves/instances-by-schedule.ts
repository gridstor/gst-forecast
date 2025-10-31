import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ url }) => {
  try {
    const scheduleId = url.searchParams.get('scheduleId');

    if (!scheduleId) {
      return new Response(JSON.stringify({
        success: false,
        instances: [],
        message: 'Schedule ID is required'
      }), { status: 400 });
    }

    // Find all instances linked to this schedule via metadata
    const instances = await prisma.curveInstance.findMany({
      where: {
        metadata: {
          path: ['linkedScheduleId'],
          equals: parseInt(scheduleId)
        }
      },
      select: {
        id: true,
        instanceVersion: true,
        status: true,
        createdAt: true,
        curveDefinition: {
          select: {
            curveName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return new Response(JSON.stringify({
      success: true,
      instances
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error fetching instances by schedule:', error);
    return new Response(JSON.stringify({
      success: false,
      instances: [],
      message: error.message || 'Failed to fetch instances'
    }), { status: 500 });
  }
};


