import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      curveDefinitionId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      leadTimeDays,
      freshnessDays,
      importance,
      responsibleTeam,
      notificationEmails,
      scheduleType,
      notes,
      dueDate
    } = body;

    // Validate required fields
    if (!curveDefinitionId || !frequency) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Curve definition and frequency are required'
      }), { status: 400 });
    }

    // Build metadata object for quick requests
    const metadata: any = {};
    if (notes) metadata.notes = notes;
    if (dueDate) metadata.dueDate = dueDate;

    // Create the schedule
    const schedule = await prisma.curveSchedule.create({
      data: {
        curveDefinitionId: parseInt(curveDefinitionId),
        scheduleType: scheduleType || 'REGULAR',
        frequency,
        dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : null,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : null,
        leadTimeDays: leadTimeDays || 0,
        freshnessDays: freshnessDays || 30,
        responsibleTeam: responsibleTeam || 'Market Analysis',
        notificationEmails: notificationEmails || [],
        importance: importance || 3,
        isActive: true,
        metadata: Object.keys(metadata).length > 0 ? metadata : null
      }
    });

    // For AD_HOC/quick requests with a due date, create a schedule run
    if (scheduleType === 'AD_HOC' && dueDate) {
      await prisma.scheduleRun.create({
        data: {
          scheduleId: schedule.id,
          runDate: new Date(dueDate),
          status: 'PENDING'
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: schedule,
      message: scheduleType === 'AD_HOC' ? 'Request created successfully' : 'Schedule created successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Failed to create schedule'
    }), { status: 500 });
  }
};

