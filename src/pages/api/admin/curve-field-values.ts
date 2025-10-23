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

    // Also include enum values from the schema as defaults/options
    const enumValues = {
      curveTypes: ['REVENUE', 'REVENUE_OTHER', 'ENERGY', 'ENERGY_ARB', 'AS', 'TB2', 'TB4', 'RA', 'DA', 'RT', 'OTHER'],
      batteryDurations: ['TWO_H', 'TWO_POINT_SIX_H', 'FOUR_H', 'EIGHT_H', 'UNKNOWN', 'OTHER'],
      scenarios: ['BASE', 'LOW', 'HIGH', 'P50', 'P90', 'P10', 'DOWNSIDE', 'UPSIDE', 'WORST', 'BEST', 'ACTUAL', 'TARGET', 'LOWER_BOUND', 'UPPER_BOUND', 'OTHER'],
      degradationTypes: ['NONE', 'YEAR_1', 'YEAR_2', 'YEAR_5', 'YEAR_10', 'YEAR_15', 'YEAR_20', 'CUSTOM', 'OTHER'],
      granularities: ['HOURLY', 'DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']
    };

    // Merge unique database values with enum values (database values take precedence)
    const allValues = {
      markets: uniqueValues.markets.length > 0 ? uniqueValues.markets : ['CAISO', 'ERCOT', 'PJM', 'MISO', 'NYISO', 'SPP'],
      locations: uniqueValues.locations,
      products: uniqueValues.products,
      commodities: uniqueValues.commodities.length > 0 ? uniqueValues.commodities : ['Energy', 'Capacity', 'Ancillary Services'],
      curveTypes: [...new Set([...uniqueValues.curveTypes, ...enumValues.curveTypes])].sort(),
      batteryDurations: [...new Set([...uniqueValues.batteryDurations, ...enumValues.batteryDurations])].sort(),
      scenarios: [...new Set([...uniqueValues.scenarios, ...enumValues.scenarios])].sort(),
      degradationTypes: [...new Set([...uniqueValues.degradationTypes, ...enumValues.degradationTypes])].sort(),
      units: uniqueValues.units.length > 0 ? uniqueValues.units : ['$/MWh', '$/kW-month', 'MWh', 'MW'],
      granularities: [...new Set([...uniqueValues.granularities, ...enumValues.granularities])].sort(),
      timezones: uniqueValues.timezones.length > 0 ? uniqueValues.timezones : ['UTC', 'America/Los_Angeles', 'America/Chicago', 'America/New_York'],
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

