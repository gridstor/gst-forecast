import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const curveIds = searchParams.get('curves')?.split(',').map(Number) || [];
    const aggregation = searchParams.get('aggregation') || 'monthly';

    const data = await prisma.price_forecasts.findMany({
      where: {
        curve_id: { in: curveIds },
      },
      select: {
        curve_id: true,
        flow_date_start: true,
        value: true,
        curve_definitions: {
          select: {
            mark_type: true,
            mark_case: true,
            mark_date: true,
            location: true,
            curve_creator: true
          }
        }
      },
      orderBy: {
        flow_date_start: 'asc'
      }
    });

    const formattedData = data
      .filter(d => d.flow_date_start && d.value && d.curve_definitions)
      .map(d => ({
        date: d.flow_date_start?.toISOString() ?? '',
        value: d.value ?? 0,
        curveId: d.curve_id,
        mark_type: d.curve_definitions?.mark_type ?? '',
        mark_case: d.curve_definitions?.mark_case ?? '',
        mark_date: d.curve_definitions?.mark_date?.toISOString() ?? '',
        location: d.curve_definitions?.location ?? '',
        curve_creator: d.curve_definitions?.curve_creator ?? ''
      }))
      .filter(d => d.date && d.value);

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching curve data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch curve data' }), 
      { status: 500 }
    );
  }
}; 