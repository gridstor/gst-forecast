import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';

export const GET: APIRoute = async () => {
  try {
    // Count total curves
    const totalCurves = await prisma.curve_definitions.count();
    
    // Get a sample of curves
    const sampleCurves = await prisma.curve_definitions.findMany({
      take: 5,
      select: {
        curve_id: true,
        market: true,
        location: true,
        mark_type: true,
        granularity: true
      }
    });

    return new Response(JSON.stringify({
      totalCurves,
      sampleCurves
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return new Response(JSON.stringify({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 