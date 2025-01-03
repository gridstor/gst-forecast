import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const location = searchParams.get('location');
    const granularity = searchParams.get('granularity');

    if (!location || !granularity) {
      return new Response(
        JSON.stringify({ error: 'Location and granularity are required' }), 
        { status: 400 }
      );
    }

    const curves = await prisma.curve_definitions.findMany({
      where: {
        location,
        granularity
      },
      select: {
        curve_id: true,
        market: true,
        location: true,
        mark_case: true,
        mark_date: true,
        mark_type: true,
        granularity: true,
        curve_creator: true
      },
      orderBy: [
        { mark_date: 'desc' }
      ]
    });

    return new Response(JSON.stringify(curves), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching curve definitions:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch curve definitions' }), 
      { status: 500 }
    );
  }
}; 