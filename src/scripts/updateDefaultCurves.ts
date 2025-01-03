import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function generateDefaultCurves() {
  const curves = await prisma.curve_definitions.findMany({
    select: {
      curve_id: true,
      market: true,
      location: true,
      mark_type: true,
      mark_case: true,
      granularity: true
    },
    where: {
      granularity: { in: ['MONTHLY', 'ANNUAL'] }
    },
    orderBy: [
      { market: 'asc' },
      { location: 'asc' },
      { mark_type: 'asc' }
    ]
  });

  interface CurveAccumulator {
    [key: string]: {
      monthly: {
        curveIds: number[];
        displayOrder: number[];
      };
      annual: {
        curveIds: number[];
        displayOrder: number[];
      };
    };
  }

  const defaultCurves = curves.reduce((acc, curve) => {
    const key = `${curve.market}-${curve.location}`;
    if (!acc[key]) {
      acc[key] = {
        monthly: { curveIds: [], displayOrder: [] },
        annual: { curveIds: [], displayOrder: [] }
      };
    }
    
    const granularity = curve.granularity?.toLowerCase() === 'monthly' ? 'monthly' : 'annual';
    acc[key][granularity].curveIds.push(curve.curve_id);
    acc[key][granularity].displayOrder.push(acc[key][granularity].curveIds.length);
    
    return acc;
  }, {} as CurveAccumulator);

  // Generate the file content
  const fileContent = `
interface CurveSet {
  curveIds: number[];
  displayOrder: number[];
}

interface LocationCurves {
  monthly: CurveSet;
  annual: CurveSet;
}

interface DefaultCurveConfig {
  [location: string]: LocationCurves;
}

export const defaultCurves: DefaultCurveConfig = ${JSON.stringify(defaultCurves, null, 2)};

export function isDefaultCurve(location: string, curveId: number, granularity: 'monthly' | 'annual'): boolean {
  return defaultCurves[location]?.[granularity].curveIds.includes(curveId) ?? false;
}

export function getDisplayOrder(location: string, curveId: number, granularity: 'monthly' | 'annual'): number | null {
  const index = defaultCurves[location]?.[granularity].curveIds.indexOf(curveId) ?? -1;
  return index >= 0 ? defaultCurves[location][granularity].displayOrder[index] : null;
}
`;

  await fs.writeFile(
    path.join(process.cwd(), 'src/config/defaultCurves.ts'),
    fileContent
  );

  console.log('Default curves updated successfully!');
  await prisma.$disconnect();
}

generateDefaultCurves().catch(console.error); 