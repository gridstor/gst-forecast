import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Returns unique values currently in use for various curve fields
 * This helps maintain consistency when creating/editing curves
 */
export const GET: APIRoute = async () => {
  try {
    // Get all curve definitions to extract unique values
    const definitions = await prisma.curveDefinition.findMany({
      select: {
        market: true,
        location: true,
        product: true,
        commodity: true,
        curveType: true,
        batteryDuration: true,
        scenario: true,
        degradationType: true,
        units: true,
        granularity: true,
        timezone: true,
      }
    });

    // Extract unique values for each field, filtering out nulls and sorting
    const uniqueValues = {
      markets: [...new Set(definitions.map(d => d.market).filter(Boolean))].sort(),
      locations: [...new Set(definitions.map(d => d.location).filter(Boolean))].sort(),
      products: [...new Set(definitions.map(d => d.product).filter(Boolean))].sort(),
      commodities: [...new Set(definitions.map(d => d.commodity).filter(Boolean))].sort(),
      curveTypes: [...new Set(definitions.map(d => d.curveType).filter(Boolean))].sort(),
      batteryDurations: [...new Set(definitions.map(d => d.batteryDuration).filter(Boolean))].sort(),
      scenarios: [...new Set(definitions.map(d => d.scenario).filter(Boolean))].sort(),
      degradationTypes: [...new Set(definitions.map(d => d.degradationType).filter(Boolean))].sort(),
      units: [...new Set(definitions.map(d => d.units).filter(Boolean))].sort(),
      granularities: [...new Set(definitions.map(d => d.granularity).filter(Boolean))].sort(),
      timezones: [...new Set(definitions.map(d => d.timezone).filter(Boolean))].sort(),
    };

    // Use ONLY database values - keep it clean and show only what's actually in use
    // If no values exist, provide minimal sensible defaults
    const allValues = {
      markets: uniqueValues.markets.length > 0 ? uniqueValues.markets : ['CAISO', 'ERCOT', 'PJM'],
      locations: uniqueValues.locations,
      products: uniqueValues.products,
      commodities: uniqueValues.commodities.length > 0 ? uniqueValues.commodities : ['Energy'],
      curveTypes: uniqueValues.curveTypes.length > 0 ? uniqueValues.curveTypes : ['REVENUE'],
      batteryDurations: uniqueValues.batteryDurations.length > 0 ? uniqueValues.batteryDurations : ['UNKNOWN'],
      scenarios: uniqueValues.scenarios.length > 0 ? uniqueValues.scenarios : ['BASE'],
      degradationTypes: uniqueValues.degradationTypes.length > 0 ? uniqueValues.degradationTypes : ['NONE'],
      units: uniqueValues.units.length > 0 ? uniqueValues.units : ['$/MWh'],
      granularities: uniqueValues.granularities.length > 0 ? uniqueValues.granularities : ['MONTHLY'],
      timezones: uniqueValues.timezones.length > 0 ? uniqueValues.timezones : ['UTC'],
    };

    // Also provide statistics
    const stats = {
      totalDefinitions: definitions.length,
      uniqueMarkets: allValues.markets.length,
      uniqueLocations: allValues.locations.length,
      uniqueProducts: allValues.products.length,
    };

    return new Response(JSON.stringify({
      values: allValues,
      stats
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60' // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error('Error fetching curve field values:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch field values',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

