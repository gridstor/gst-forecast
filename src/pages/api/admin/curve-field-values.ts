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
        // product, granularity, scenario, degradationType moved to instance level
        batteryDuration: true,
        units: true,
        timezone: true,
      }
    });

    // Get curve instances for fields moved to instance level
    const instances = await prisma.curveInstance.findMany({
      select: {
        curveTypes: true,
        commodities: true,
        scenarios: true,
        granularity: true,
        degradationType: true,
      }
    });

    // Extract unique values from arrays
    const allCurveTypes = instances.flatMap(i => i.curveTypes || []);
    const allCommodities = instances.flatMap(i => i.commodities || []);
    const allScenarios = instances.flatMap(i => i.scenarios || []);

    // Extract unique values for each field, filtering out nulls and sorting
    const uniqueValues = {
      markets: [...new Set(definitions.map(d => d.market).filter(Boolean))].sort(),
      locations: [...new Set(definitions.map(d => d.location).filter(Boolean))].sort(),
      // These now come from instances (arrays flattened):
      commodities: [...new Set(allCommodities.filter(Boolean))].sort(),
      curveTypes: [...new Set(allCurveTypes.filter(Boolean))].sort(),
      granularities: [...new Set(instances.map(i => i.granularity).filter(Boolean))].sort(),
      scenarios: [...new Set(allScenarios.filter(Boolean))].sort(),
      degradationTypes: [...new Set(instances.map(i => i.degradationType).filter(Boolean))].sort(),
      // These still come from definitions:
      batteryDurations: [...new Set(definitions.map(d => d.batteryDuration).filter(Boolean))].sort(),
      units: [...new Set(definitions.map(d => d.units).filter(Boolean))].sort(),
      timezones: [...new Set(definitions.map(d => d.timezone).filter(Boolean))].sort(),
    };

    // Use ONLY database values - keep it clean and show only what's actually in use
    // If no values exist, provide minimal sensible defaults
    const allValues = {
      markets: uniqueValues.markets.length > 0 ? uniqueValues.markets : ['CAISO', 'ERCOT', 'PJM'],
      locations: uniqueValues.locations,
      // All these now come from instances:
      commodities: uniqueValues.commodities.length > 0 ? uniqueValues.commodities : ['Total Revenue', 'EA Revenue', 'AS Revenue'],
      curveTypes: uniqueValues.curveTypes.length > 0 ? uniqueValues.curveTypes : ['Revenue Forecast', 'Price Forecast'],
      granularities: uniqueValues.granularities.length > 0 ? uniqueValues.granularities : ['MONTHLY', 'QUARTERLY', 'ANNUAL'],
      scenarios: uniqueValues.scenarios.length > 0 ? uniqueValues.scenarios : ['BASE', 'HIGH', 'LOW'],
      degradationTypes: uniqueValues.degradationTypes.length > 0 ? uniqueValues.degradationTypes : ['NONE', 'YEAR_1', 'YEAR_5', 'YEAR_10'],
      // These still from definitions:
      batteryDurations: uniqueValues.batteryDurations.length > 0 ? uniqueValues.batteryDurations : ['2H', '4H', '8H'],
      units: uniqueValues.units.length > 0 ? uniqueValues.units : ['$/MWh', '$/kW-month', 'MWh'],
      timezones: uniqueValues.timezones.length > 0 ? uniqueValues.timezones : ['UTC', 'America/Los_Angeles', 'America/New_York'],
    };

    // Also provide statistics
    const stats = {
      totalDefinitions: definitions.length,
      totalInstances: instances.length,
      uniqueMarkets: allValues.markets.length,
      uniqueLocations: allValues.locations.length,
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
