import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const location = url.searchParams.get('location');
    
    // Fetch all curve definitions with their instances
    const definitions = await prisma.curveDefinition.findMany({
      where: location ? { location } : undefined,
      include: {
        instances: {
          include: {
            curveData: {
              select: {
                id: true,
                curveType: true,
                commodity: true,
                scenario: true,
                freshnessStartDate: true,
                freshnessEndDate: true,
                timestamp: true,
                value: true
              },
              orderBy: {
                timestamp: 'asc'
              }
            }
          },
          select: {
            id: true,
            instanceVersion: true,
            curveTypes: true,
            commodities: true,
            scenarios: true,
            granularity: true,
            degradationType: true,
            deliveryPeriodStart: true,
            deliveryPeriodEnd: true,
            forecastRunDate: true,
            freshnessStartDate: true,  // Keep for backward compatibility
            freshnessEndDate: true,     // Keep for backward compatibility
            status: true,
            modelType: true,
            createdBy: true,
            createdAt: true,
            curveData: true
          },
          orderBy: {
            freshnessStartDate: 'desc'
          }
        }
      },
      orderBy: [
        { location: 'asc' },
        { market: 'asc' }
      ]
    });

    // Process instances to group curve data by type + commodity with freshness
    const processedDefinitions = definitions.map(def => {
      // For each instance, group curve data by curveType + commodity
      const processedInstances = def.instances.map(inst => {
        // Group curve data by curveType + commodity combination
        const groupedData: Record<string, any> = {};
        
        inst.curveData.forEach(data => {
          const key = `${data.curveType}::${data.commodity}`;
          
          if (!groupedData[key]) {
            groupedData[key] = {
              curveType: data.curveType,
              commodity: data.commodity,
              scenarios: new Set<string>(),
              freshnessStartDate: data.freshnessStartDate || inst.freshnessStartDate,
              freshnessEndDate: data.freshnessEndDate || inst.freshnessEndDate,
              dataPointCount: 0,
              hasPValues: false
            };
          }
          
          groupedData[key].scenarios.add(data.scenario);
          groupedData[key].dataPointCount++;
          
          // Check for P-values
          if (data.scenario.includes('P5') || data.scenario.includes('P05') || 
              data.scenario.includes('P95')) {
            groupedData[key].hasPValues = true;
          }
        });
        
        // Convert to array with freshness status
        const curveDataGroups = Object.values(groupedData).map((group: any) => {
          const freshStart = group.freshnessStartDate ? new Date(group.freshnessStartDate) : null;
          const freshEnd = group.freshnessEndDate ? new Date(group.freshnessEndDate) : null;
          const now = new Date();
          
          const isCurrent = !freshEnd || freshEnd > now;
          
          return {
            curveType: group.curveType,
            commodity: group.commodity,
            scenarios: Array.from(group.scenarios),
            freshnessStartDate: group.freshnessStartDate,
            freshnessEndDate: group.freshnessEndDate,
            isCurrent,
            hasPValues: group.hasPValues,
            dataPointCount: group.dataPointCount,
            createdBy: inst.createdBy
          };
        });
        
        // Sort by freshness (current first), then by commodity
        curveDataGroups.sort((a, b) => {
          if (a.isCurrent && !b.isCurrent) return -1;
          if (!a.isCurrent && b.isCurrent) return 1;
          return a.commodity.localeCompare(b.commodity);
        });
        
        return {
          instanceId: inst.id,
          instanceVersion: inst.instanceVersion,
          curveDataGroups,
          metadata: {
            granularity: inst.granularity,
            status: inst.status,
            modelType: inst.modelType,
            forecastRunDate: inst.forecastRunDate,
            createdAt: inst.createdAt
          }
        };
      });
      
      return {
        id: def.id,
        curveName: def.curveName,
        market: def.market,
        location: def.location,
        batteryDuration: def.batteryDuration,
        units: def.units,
        description: def.description,
        instances: processedInstances
      };
    });

    // Group by location
    const byLocation = processedDefinitions.reduce((acc, def) => {
      if (!acc[def.location]) {
        acc[def.location] = [];
      }
      acc[def.location].push(def);
      return acc;
    }, {} as Record<string, any[]>);

    return new Response(JSON.stringify({
      success: true,
      byLocation,
      locations: Object.keys(byLocation).sort()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching curves for browser:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch curves'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

