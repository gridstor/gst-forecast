import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const {
      // Curve Definition fields
      market,
      location,
      product,
      curveType,
      batteryDuration = 'UNKNOWN',
      scenario = 'BASE',
      
      // Instance Template fields
      deliveryPeriodStart,
      deliveryPeriodEnd,
      degradationStartDate = null,
      granularity = 'MONTHLY',
      instanceVersion = 'v1',
      
      // Schedule fields
      frequency = 'MONTHLY',
      dayOfWeek = null,
      dayOfMonth = null,
      timeOfDay = '09:00:00',
      freshnessDays = 30,
      responsibleTeam = 'Market Analysis',
      notificationEmails = [],
      importance = 3,
      createdBy = 'system'
    } = body;

    // Validate required fields
    if (!market || !location || !product || !curveType || !deliveryPeriodStart || !deliveryPeriodEnd) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: market, location, product, curveType, deliveryPeriodStart, deliveryPeriodEnd' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate delivery period
    const deliveryStart = new Date(deliveryPeriodStart);
    const deliveryEnd = new Date(deliveryPeriodEnd);
    
    if (deliveryEnd <= deliveryStart) {
      return new Response(
        JSON.stringify({ 
          error: 'Delivery end date must be after start date' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate degradation date if provided
    if (degradationStartDate) {
      const degradationDate = new Date(degradationStartDate);
      if (degradationDate < deliveryStart || degradationDate > deliveryEnd) {
        return new Response(
          JSON.stringify({ 
            error: 'Degradation start date must be within delivery period' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Call the enhanced creation function
    const result = await prisma.$queryRaw`
      SELECT "Forecasts".create_schedule_with_instance_template(
        ${market}::VARCHAR,
        ${location}::VARCHAR,
        ${product}::VARCHAR,
        ${curveType}::VARCHAR,
        ${deliveryPeriodStart}::TIMESTAMPTZ,
        ${deliveryPeriodEnd}::TIMESTAMPTZ,
        ${batteryDuration}::VARCHAR,
        ${scenario}::VARCHAR,
        ${'NONE'}::VARCHAR,
        ${degradationStartDate}::DATE,
        ${granularity}::VARCHAR,
        ${instanceVersion}::VARCHAR,
        ${frequency}::"Forecasts"."UpdateFrequency",
        ${dayOfWeek}::INTEGER,
        ${dayOfMonth}::INTEGER,
        ${timeOfDay}::TIME,
        ${freshnessDays}::INTEGER,
        ${responsibleTeam}::VARCHAR,
        ${importance}::INTEGER,
        ${createdBy}::VARCHAR
      ) as creation_result
    `;

    const creationResult = (result as any)[0]?.creation_result;

    if (!creationResult) {
      throw new Error('Failed to create enhanced schedule');
    }

    // Convert BigInt values to strings for JSON serialization
    const safeCreationResult = JSON.parse(JSON.stringify(creationResult, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    // Update notification emails separately (since it's not in the function)
    if (notificationEmails && notificationEmails.length > 0) {
      await prisma.$executeRaw`
        UPDATE "Forecasts"."CurveSchedule" 
        SET "notificationEmails" = ${notificationEmails}::TEXT[]
        WHERE id = ${safeCreationResult.scheduleId}
      `;
    }

    // Get the created schedule details from the management view
    const scheduleDetails = await prisma.$queryRaw`
      SELECT * FROM "Forecasts".schedule_management 
      WHERE schedule_id = ${safeCreationResult.scheduleId}
    `;

    // Convert BigInt values in schedule details too
    const safeScheduleDetails = JSON.parse(JSON.stringify((scheduleDetails as any)[0], (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return new Response(
      JSON.stringify({ 
        success: true,
        result: safeCreationResult,
        schedule: safeScheduleDetails,
        message: 'Enhanced schedule created successfully with instance template'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating enhanced schedule:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create enhanced schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 