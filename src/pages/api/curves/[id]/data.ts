import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: APIRoute = async ({ params }) => {
  try {
    const curveId = parseInt(params.id as string);
    
    if (isNaN(curveId)) {
      return new Response(JSON.stringify({ error: 'Invalid curve ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch price forecast data for the curve
    const priceData = await prisma.price_forecasts.findMany({
      where: {
        curve_id: curveId
      },
      orderBy: {
        flow_date_start: 'asc'
      },
      select: {
        flow_date_start: true,
        value: true,
        units: true,
        mark_date: true
      }
    });

    return new Response(JSON.stringify(priceData), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching curve data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};