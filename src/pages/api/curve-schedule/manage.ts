import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const view = searchParams.get('view') || 'grid';
    const status = searchParams.get('status');
    const market = searchParams.get('market');
    const team = searchParams.get('team');
    const curveType = searchParams.get('curveType');

    let query = `
      SELECT * FROM "Forecasts".schedule_management 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (status) {
      query += ` AND schedule_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (market) {
      query += ` AND "market" = $${paramIndex}`;
      params.push(market);
      paramIndex++;
    }

    if (team) {
      query += ` AND "responsibleTeam" = $${paramIndex}`;
      params.push(team);
      paramIndex++;
    }

    if (curveType) {
      query += ` AND "curveType" = $${paramIndex}`;
      params.push(curveType);
      paramIndex++;
    }

    query += ` ORDER BY 
      CASE WHEN schedule_status = 'SCHEDULED' AND is_overdue THEN 1
           WHEN schedule_status = 'SCHEDULED' THEN 2  
           WHEN schedule_status = 'IN_PROGRESS' THEN 3
           ELSE 4 END,
      "importance" DESC,
      next_delivery_due`;

    const schedules = await prisma.$queryRawUnsafe(query, ...params);

    // Helper function to handle BigInt serialization
    const serializeBigInt = (obj: any) => {
      return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
    };

    // If calendar view, also get calendar-specific data
    if (view === 'calendar') {
      const calendarData = await prisma.$queryRaw`
        SELECT * FROM "Forecasts".schedule_calendar
        ORDER BY event_date
      `;
      
      return new Response(
        JSON.stringify({ 
          schedules: serializeBigInt(schedules),
          calendarEvents: serializeBigInt(calendarData),
          view: 'calendar'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get summary statistics
    const summary = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_schedules,
        COUNT(*) FILTER (WHERE schedule_status = 'SCHEDULED') as scheduled_count,
        COUNT(*) FILTER (WHERE schedule_status = 'IN_PROGRESS') as in_progress_count,
        COUNT(*) FILTER (WHERE schedule_status = 'COMPLETED') as completed_count,
        COUNT(*) FILTER (WHERE is_overdue) as overdue_count
      FROM "Forecasts".schedule_management
    `;

    return new Response(
      JSON.stringify({ 
        schedules: serializeBigInt(schedules),
        summary: serializeBigInt((summary as any)[0]),
        view: 'grid'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch schedules',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { scheduleId, deletedBy = 'system' } = body;

    if (!scheduleId) {
      return new Response(
        JSON.stringify({ error: 'Schedule ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use the safe delete function
    const result = await prisma.$queryRaw`
      SELECT "Forecasts".delete_schedule_safe(
        ${scheduleId}::INTEGER,
        ${deletedBy}::VARCHAR
      ) as deleted
    `;

    const deleted = (result as any)[0]?.deleted;

    if (deleted) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Schedule deleted successfully'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Failed to delete schedule');
    }

  } catch (error) {
    console.error('Error deleting schedule:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      scheduleId, 
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      freshnessDays,
      responsibleTeam,
      notificationEmails,
      importance,
      updatedBy = 'system'
    } = body;

    if (!scheduleId) {
      return new Response(
        JSON.stringify({ error: 'Schedule ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the schedule using Prisma
    const updatedSchedule = await prisma.$queryRaw`
      UPDATE "Forecasts"."CurveSchedule" 
      SET 
        "frequency" = ${frequency}::"Forecasts"."UpdateFrequency",
        "dayOfWeek" = ${dayOfWeek}::INTEGER,
        "dayOfMonth" = ${dayOfMonth}::INTEGER,
        "timeOfDay" = ${timeOfDay}::TIME,
        "freshnessDays" = ${freshnessDays}::INTEGER,
        "responsibleTeam" = ${responsibleTeam}::VARCHAR,
        "notificationEmails" = ${notificationEmails}::TEXT[],
        "importance" = ${importance}::INTEGER,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${scheduleId}
      RETURNING "id"
    `;

    // Get the updated schedule details
    const scheduleDetails = await prisma.$queryRaw`
      SELECT * FROM "Forecasts".schedule_management 
      WHERE schedule_id = ${scheduleId}
    `;

    return new Response(
      JSON.stringify({ 
        success: true,
        schedule: (scheduleDetails as any)[0],
        message: 'Schedule updated successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating schedule:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 