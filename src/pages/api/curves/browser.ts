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
          orderBy: {
            freshnessStartDate: 'desc'
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
            freshnessStartDate: true,
            freshnessEndDate: true,
            status: true,
            modelType: true,
            createdBy: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { location: 'asc' },
        { market: 'asc' }
      ]
    });

    // Helper function to determine curve quality tier
    const getCurveQualityTier = (instance: any, curveName: string) => {
      const isCurrent = !instance.freshnessEndDate || new Date(instance.freshnessEndDate) > new Date();
      const hasP5 = instance.scenarios?.includes('P5') || instance.scenarios?.includes('P05');
      const hasP95 = instance.scenarios?.includes('P95');
      const hasPValues = hasP5 && hasP95;
      const isGridStor = instance.createdBy?.toLowerCase().includes('gridstor') || 
                        instance.createdBy?.toLowerCase().includes('internal');
      
      // Tier 1: Fresh GridStor P-value curve (BEST)
      if (isCurrent && isGridStor && hasPValues) {
        return { tier: 1, label: 'Fresh GridStor P-values', color: 'emerald', icon: '✨' };
      }
      
      // Tier 2: Fresh external P-value curve
      if (isCurrent && !isGridStor && hasPValues) {
        return { tier: 2, label: 'Fresh External P-values', color: 'blue', icon: '📊' };
      }
      
      // Tier 3: Fresh GridStor non-P-value curve
      if (isCurrent && isGridStor && !hasPValues) {
        return { tier: 3, label: 'Fresh GridStor (no P-values)', color: 'cyan', icon: '📈' };
      }
      
      // Tier 4: Archived GridStor P-value curve
      if (!isCurrent && isGridStor && hasPValues) {
        return { tier: 4, label: 'Archived GridStor P-values', color: 'amber', icon: '🕐' };
      }
      
      // Tier 5: Fresh external non-P-value curve
      if (isCurrent && !isGridStor && !hasPValues) {
        return { tier: 5, label: 'Fresh External (no P-values)', color: 'purple', icon: '📉' };
      }
      
      // Tier 6: Archived (lowest priority)
      return { tier: 6, label: 'Archived', color: 'gray', icon: '📦' };
    };

    // Group by location
    const byLocation = definitions.reduce((acc, def) => {
      if (!acc[def.location]) {
        acc[def.location] = [];
      }
      
      const enrichedInstances = def.instances.map(inst => {
        const isCurrent = !inst.freshnessEndDate || new Date(inst.freshnessEndDate) > new Date();
        const qualityTier = getCurveQualityTier(inst, def.curveName);
        const hasP5 = inst.scenarios?.includes('P5') || inst.scenarios?.includes('P05');
        const hasP95 = inst.scenarios?.includes('P95');
        const hasPValues = hasP5 && hasP95;
        return {
          ...inst,
          isCurrent,
          qualityTier,
          hasPValues
        };
      });
      
      // Sort instances by quality tier (best first)
      enrichedInstances.sort((a, b) => a.qualityTier.tier - b.qualityTier.tier);
      
      // Determine provider (GridStor if any instance is GridStor)
      const isGridStor = enrichedInstances.some(inst => 
        inst.createdBy?.toLowerCase().includes('gridstor') || 
        inst.createdBy?.toLowerCase().includes('internal')
      );
      const provider = isGridStor ? 'GridStor' : 'External';
      
      acc[def.location].push({
        id: def.id,
        curveName: def.curveName,
        market: def.market,
        location: def.location,
        batteryDuration: def.batteryDuration,
        units: def.units,
        description: def.description,
        instances: enrichedInstances,
        bestAvailable: enrichedInstances[0]?.qualityTier || null,
        provider
      });
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

