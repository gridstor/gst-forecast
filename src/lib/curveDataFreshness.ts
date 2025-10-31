/**
 * Curve Data Freshness Utilities
 * 
 * Manages freshness tracking at the CurveData level instead of CurveInstance level.
 * This allows different curve types/commodities within the same instance to have
 * different freshness periods (e.g., third-party updates weekly, internal updates monthly).
 */

import { prisma } from './prisma';

export interface FreshnessUpdate {
  curveInstanceId: number;
  curveType: string;
  commodity: string;
  freshnessStartDate: Date;
  freshnessEndDate?: Date | null;
}

/**
 * Update freshness for a specific curve type + commodity combination
 * 
 * @param update - Freshness update details
 * @returns Number of rows updated
 */
export async function updateCurveDataFreshness(update: FreshnessUpdate): Promise<number> {
  const result = await prisma.curveData.updateMany({
    where: {
      curveInstanceId: update.curveInstanceId,
      curveType: update.curveType,
      commodity: update.commodity
    },
    data: {
      freshnessStartDate: update.freshnessStartDate,
      freshnessEndDate: update.freshnessEndDate
    }
  });
  
  return result.count;
}

/**
 * Mark a curve data group as superseded (set freshnessEndDate)
 * 
 * @param curveInstanceId - Instance ID
 * @param curveType - Curve type to supersede
 * @param commodity - Commodity to supersede
 * @param endDate - When it was superseded (defaults to now)
 */
export async function supersedeCurveData(
  curveInstanceId: number,
  curveType: string,
  commodity: string,
  endDate: Date = new Date()
): Promise<number> {
  const result = await prisma.curveData.updateMany({
    where: {
      curveInstanceId,
      curveType,
      commodity,
      freshnessEndDate: null // Only update currently fresh data
    },
    data: {
      freshnessEndDate: endDate
    }
  });
  
  return result.count;
}

/**
 * Get currently fresh curve data grouped by type + commodity
 * 
 * @param definitionId - Curve definition ID
 * @returns Grouped fresh curve data
 */
export async function getFreshCurveDataGroups(definitionId: number) {
  const instances = await prisma.curveInstance.findMany({
    where: {
      curveDefinitionId: definitionId
    },
    include: {
      curveData: {
        where: {
          OR: [
            { freshnessEndDate: null },
            { freshnessEndDate: { gt: new Date() } }
          ]
        },
        select: {
          id: true,
          curveType: true,
          commodity: true,
          scenario: true,
          freshnessStartDate: true,
          freshnessEndDate: true,
          timestamp: true,
          value: true,
          units: true
        }
      }
    }
  });
  
  // Group by curveType + commodity
  const groups: Record<string, any> = {};
  
  instances.forEach(inst => {
    inst.curveData.forEach(data => {
      const key = `${data.curveType}::${data.commodity}`;
      
      if (!groups[key]) {
        groups[key] = {
          instanceId: inst.id,
          instanceVersion: inst.instanceVersion,
          curveType: data.curveType,
          commodity: data.commodity,
          scenarios: new Set<string>(),
          freshnessStartDate: data.freshnessStartDate,
          freshnessEndDate: data.freshnessEndDate,
          dataPoints: []
        };
      }
      
      groups[key].scenarios.add(data.scenario);
      groups[key].dataPoints.push(data);
    });
  });
  
  return Object.values(groups).map((g: any) => ({
    ...g,
    scenarios: Array.from(g.scenarios)
  }));
}

/**
 * Set freshness for newly uploaded curve data
 * Helper function to be called after curve upload
 */
export async function setFreshnessForNewCurveData(
  curveInstanceId: number,
  curveType: string,
  commodity: string,
  startDate: Date = new Date(),
  endDate: Date | null = null
): Promise<void> {
  // First, supersede any existing fresh data of the same type/commodity
  await prisma.curveData.updateMany({
    where: {
      curveInstance: {
        curveDefinitionId: {
          in: await prisma.curveInstance.findMany({
            where: { id: curveInstanceId },
            select: { curveDefinitionId: true }
          }).then(results => results.map(r => r.curveDefinitionId))
        }
      },
      curveType,
      commodity,
      freshnessEndDate: null
    },
    data: {
      freshnessEndDate: startDate
    }
  });
  
  // Set freshness for new data
  await prisma.curveData.updateMany({
    where: {
      curveInstanceId,
      curveType,
      commodity
    },
    data: {
      freshnessStartDate: startDate,
      freshnessEndDate: endDate
    }
  });
}

/**
 * Query example: Get all currently fresh Total Revenue curves across all locations
 */
export async function getCurrentFreshCurves(
  curveType?: string,
  commodity?: string,
  market?: string
) {
  return await prisma.curveData.groupBy({
    by: ['curveInstanceId', 'curveType', 'commodity'],
    where: {
      AND: [
        curveType ? { curveType } : {},
        commodity ? { commodity } : {},
        market ? { curveInstance: { curveDefinition: { market } } } : {},
        {
          OR: [
            { freshnessEndDate: null },
            { freshnessEndDate: { gt: new Date() } }
          ]
        }
      ]
    },
    _count: true
  });
}

