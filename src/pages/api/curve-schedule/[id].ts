import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Schedule ID is required'
      }), { status: 400 });
    }

    const schedule = await prisma.curveSchedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        curveDefinition: true,
        scheduleRuns: {
          orderBy: { runDate: 'desc' },
          take: 10
        }
      }
    });

    if (!schedule) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Schedule not found'
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      data: schedule
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error fetching schedule:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Failed to fetch schedule'
    }), { status: 500 });
  }
};


