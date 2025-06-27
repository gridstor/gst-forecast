import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const {
      curveName,
      market,
      location,
      product,
      curveType,
      batteryDuration,
      scenario,
      degradationType,
      commodity = 'Energy',
      units = '$/MWh',
      description,
      createdBy = 'Upload System'
    } = body;

    // Validate required fields
    if (!curveName || !market || !location || !product || !curveType) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: curveName, market, location, product, curveType' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Try to find existing curve definition first
    let curveDefinition = await prisma.curveDefinition.findFirst({
      where: {
        curveName,
        market,
        location,
        product,
        curveType,
        batteryDuration: batteryDuration || 'UNKNOWN',
        scenario: scenario || 'BASE'
      }
    });

    // If not found, create new one
    if (!curveDefinition) {
      curveDefinition = await prisma.curveDefinition.create({
        data: {
          curveName,
          market,
          location,
          product,
          curveType,
          batteryDuration: batteryDuration || 'UNKNOWN',
          scenario: scenario || 'BASE',
          degradationType: degradationType || 'NONE',
          commodity,
          units,
          description,
          createdBy
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        curveDefinition,
        isNew: !curveDefinition.createdAt || new Date().getTime() - new Date(curveDefinition.createdAt).getTime() < 5000
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating curve definition:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create curve definition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}; 