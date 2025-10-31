import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      id,
      frequency,
      dayOfWeek,
      dayOfMonth,
      importance,
      responsibleTeam,
      notificationEmails,
      isActive,
      notes,
      dueDate,
      status
    } = body;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Schedule ID is required'
      }), { status: 400 });
    }

    // Get existing schedule to check type
    const existing = await prisma.curveSchedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        scheduleRuns: true
      }
    });

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Schedule not found'
      }), { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (frequency !== undefined) updateData.frequency = frequency;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek ? parseInt(dayOfWeek) : null;
    if (dayOfMonth !== undefined) updateData.dayOfMonth = dayOfMonth ? parseInt(dayOfMonth) : null;
    if (importance !== undefined) updateData.importance = parseInt(importance);
    if (responsibleTeam !== undefined) updateData.responsibleTeam = responsibleTeam;
    if (notificationEmails !== undefined) updateData.notificationEmails = notificationEmails;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle metadata updates for AD_HOC schedules
    if (existing.scheduleType === 'AD_HOC') {
      const metadata: any = existing.metadata || {};
      if (notes !== undefined) metadata.notes = notes;
      if (dueDate !== undefined) metadata.dueDate = dueDate;
      if (Object.keys(metadata).length > 0) {
        updateData.metadata = metadata;
      }
    }

    // Update the schedule
    const updated = await prisma.curveSchedule.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // If this is an AD_HOC schedule and dueDate changed, update/create the ScheduleRun
    if (existing.scheduleType === 'AD_HOC' && dueDate !== undefined) {
      const existingRun = existing.scheduleRuns[0];
      
      if (existingRun) {
        // Update existing run
        await prisma.scheduleRun.update({
          where: { id: existingRun.id },
          data: { 
            runDate: new Date(dueDate),
            status: status || existingRun.status
          }
        });
      } else {
        // Create new run
        await prisma.scheduleRun.create({
          data: {
            scheduleId: updated.id,
            runDate: new Date(dueDate),
            status: status || 'PENDING'
          }
        });
      }
    }

    // Update status on existing run if provided
    if (status !== undefined && existing.scheduleRuns.length > 0) {
      await prisma.scheduleRun.update({
        where: { id: existing.scheduleRuns[0].id },
        data: { status }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: updated,
      message: 'Schedule updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Failed to update schedule'
    }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Schedule ID is required'
      }), { status: 400 });
    }

    // Delete will cascade to ScheduleRuns
    await prisma.curveSchedule.delete({
      where: { id: parseInt(id) }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Schedule deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Failed to delete schedule'
    }), { status: 500 });
  }
};


