import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { instanceId, scheduleId } = body;

    if (!instanceId || !scheduleId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Instance ID and Schedule ID are required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get the instance
    const instance = await prisma.curveInstance.findUnique({
      where: { id: parseInt(instanceId) },
      include: { curveDefinition: true }
    });

    if (!instance) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Instance not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Get the schedule
    const schedule = await prisma.curveSchedule.findUnique({
      where: { id: parseInt(scheduleId) }
    });

    if (!schedule) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Schedule not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify they match the same curve definition
    if (instance.curveDefinitionId !== schedule.curveDefinitionId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Instance and schedule must belong to the same curve definition'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Update instance metadata to link to schedule
    const metadata = (instance.metadata as any) || {};
    metadata.linkedScheduleId = parseInt(scheduleId);
    metadata.linkedAt = new Date().toISOString();

    await prisma.curveInstance.update({
      where: { id: parseInt(instanceId) },
      data: { metadata }
    });

    // If this is an AD_HOC schedule, update the schedule run status
    if (schedule.scheduleType === 'AD_HOC') {
      const scheduleRuns = await prisma.scheduleRun.findMany({
        where: { scheduleId: parseInt(scheduleId) },
        orderBy: { runDate: 'desc' },
        take: 1
      });

      if (scheduleRuns.length > 0) {
        await prisma.scheduleRun.update({
          where: { id: scheduleRuns[0].id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            instancesCreated: 1,
            metadata: { 
              ...((scheduleRuns[0].metadata as any) || {}),
              curveInstanceId: parseInt(instanceId)
            }
          }
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Instance linked to schedule successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error linking instance:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Failed to link instance'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { instanceId } = body;

    if (!instanceId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Instance ID is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get the instance
    const instance = await prisma.curveInstance.findUnique({
      where: { id: parseInt(instanceId) }
    });

    if (!instance) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Instance not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Remove link from metadata
    const metadata = (instance.metadata as any) || {};
    delete metadata.linkedScheduleId;
    delete metadata.linkedAt;

    await prisma.curveInstance.update({
      where: { id: parseInt(instanceId) },
      data: { metadata }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Instance unlinked successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error unlinking instance:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Failed to unlink instance'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

