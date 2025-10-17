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

    // Fetch curve data for the instance (new schema)
    const priceData = await prisma.curveData.findMany({
      where: {
        curveInstanceId: curveId
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        id: true,
        timestamp: true,
        valueP5: true,
        valueP25: true,
        valueP50: true,
        valueP75: true,
        valueP95: true
      }
    });

    // Transform to match expected format
    const formattedData = priceData.map(d => ({
      id: d.id,
      flow_date_start: d.timestamp,
      valueP5: d.valueP5,
      valueP25: d.valueP25,
      value: d.valueP50,
      valueP50: d.valueP50,
      valueP75: d.valueP75,
      valueP95: d.valueP95
    }));

    return new Response(JSON.stringify(formattedData), {
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