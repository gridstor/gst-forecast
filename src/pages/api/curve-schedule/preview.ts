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
      degradationType = 'NONE',
      
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

    // Call the preview function
    const preview = await prisma.$queryRaw`
      SELECT "Forecasts".preview_schedule_creation(
        ${market}::VARCHAR,
        ${location}::VARCHAR,
        ${product}::VARCHAR,
        ${curveType}::VARCHAR,
        ${deliveryPeriodStart}::TIMESTAMPTZ,
        ${deliveryPeriodEnd}::TIMESTAMPTZ,
        ${batteryDuration}::VARCHAR,
        ${scenario}::VARCHAR,
        ${degradationType}::VARCHAR,
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
      ) as preview_data
    `;

    const previewData = (preview as any)[0]?.preview_data;

    if (!previewData) {
      throw new Error('Failed to generate preview');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        preview: previewData
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating preview:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 