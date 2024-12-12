import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { formatDate } from '../../utils/dates';

const ITEMS_PER_PAGE = 9;

export const GET: APIRoute = async ({ url }) => {
  try {
    const page = Number(url.searchParams.get('page')) || 1;
    const allForecasts = await getCollection('forecasts');
    
    const sortedForecasts = allForecasts.sort((a, b) => 
      b.data.date.getTime() - a.data.date.getTime()
    );

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedForecasts = sortedForecasts.slice(start, end);

    // Instead of trying to render components, return the data
    const forecastsData = paginatedForecasts.map(forecast => ({
      id: forecast.id,
      slug: forecast.slug,
      data: {
        ...forecast.data,
        date: formatDate(forecast.data.date)
      }
    }));

    return new Response(JSON.stringify({
      forecasts: forecastsData,
      hasMore: end < sortedForecasts.length
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch forecasts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}