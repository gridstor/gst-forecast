import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CURVE_TYPES = {
  ENERGY_ARB: 'Energy Arbitrage',
  ANC_SERVICES: 'Ancillary Services',
  TOTAL_REVENUE: 'Total Revenue',
  TB2_ENERGY: 'TB2 Energy',
  TB4_ENERGY: 'TB4 Energy',
  RA: 'Resource Adequacy',
  REG_UP: 'Regulation Up',
  REG_DOWN: 'Regulation Down',
  SPIN: 'Spin',
  NON_SPIN: 'Non-Spin',
  ECRS: 'ECRS'
};

const GRANULARITIES = ['ANNUAL', 'MONTHLY'];
const MODEL_TYPES = ['HISTORICAL', 'QUANTITATIVE', 'FUNDAMENTALS'];

interface LocationConfig {
  name: string;
  importance: number;
  curveTypes: string[];
}

const ERCOT_LOCATIONS: LocationConfig[] = [
  // Site-specific locations
  { name: 'ERCOT-Odessa', importance: 3, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB2_ENERGY] },
  { name: 'ERCOT-Hidden Lakes', importance: 3, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB2_ENERGY] },
  { name: 'ERCOT-Gunner Noodles', importance: 3, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB2_ENERGY] },
  // Hub locations
  { name: 'ERCOT-Houston Hub', importance: 4, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB2_ENERGY] },
  { name: 'ERCOT-South Hub', importance: 4, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB2_ENERGY] },
  { name: 'ERCOT-West Hub', importance: 4, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB2_ENERGY] }
];

const CAISO_LOCATIONS: LocationConfig[] = [
  // Site-specific locations
  { name: 'CAISO-Goleta', importance: 3, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB4_ENERGY] },
  { name: 'CAISO-SFS Noodles', importance: 3, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB4_ENERGY] },
  // Hub locations
  { name: 'CAISO-SP15 Hub', importance: 4, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB4_ENERGY] },
  { name: 'CAISO-NP15 Hub', importance: 4, curveTypes: [CURVE_TYPES.ENERGY_ARB, CURVE_TYPES.ANC_SERVICES, CURVE_TYPES.TOTAL_REVENUE, CURVE_TYPES.TB4_ENERGY] }
];

const ERCOT_MARKET_SERVICES = [
  { name: 'ERCOT-Market', importance: 5, curveTypes: [CURVE_TYPES.REG_UP, CURVE_TYPES.REG_DOWN, CURVE_TYPES.ECRS] }
];

const CAISO_MARKET_SERVICES = [
  { name: 'CAISO-Market', importance: 5, curveTypes: [CURVE_TYPES.RA, CURVE_TYPES.REG_UP, CURVE_TYPES.REG_DOWN, CURVE_TYPES.SPIN, CURVE_TYPES.NON_SPIN] }
];

async function createCurveSchedule(
  location: string,
  sourceType: string,
  provider: string,
  curveType: string,
  granularity: string,
  modelType: string | null,
  importance: number,
  updateFrequency: string
) {
  const curvePattern = modelType
    ? `GST_${location}_${curveType}_${modelType}`
    : `AURORA_${location}_${curveType}`;

  const description = modelType
    ? `GST ${location} ${curveType} - ${modelType} Model`
    : `Aurora ${location} ${curveType}`;

  const nextUpdateDue = new Date();
  nextUpdateDue.setDate(nextUpdateDue.getDate() + (updateFrequency === 'QUARTERLY' ? 90 : 30));

  return prisma.curveSchedule.create({
    data: {
      curvePattern,
      location,
      sourceType,
      provider,
      granularity,
      modelType: modelType || null,
      updateFrequency,
      updateDay: 1,
      responsibleTeam: 'Market Analysis',
      description,
      importance,
      lastReceivedDate: new Date(),
      nextExpectedDate: nextUpdateDue,
      lastUpdatedDate: new Date(),
      nextUpdateDue,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

async function main() {
  // Clear existing data
  await prisma.curveComment.deleteMany();
  await prisma.curveReceipt.deleteMany();
  await prisma.curveUpdateHistory.deleteMany();
  await prisma.curveSchedule.deleteMany();

  // Create external curves
  for (const location of [...ERCOT_LOCATIONS, ...CAISO_LOCATIONS, ...ERCOT_MARKET_SERVICES, ...CAISO_MARKET_SERVICES]) {
    for (const curveType of location.curveTypes) {
      for (const granularity of GRANULARITIES) {
        await createCurveSchedule(
          location.name,
          'EXTERNAL',
          'Aurora',
          curveType,
          granularity,
          null,
          location.importance,
          'QUARTERLY'
        );
      }
    }
  }

  // Create internal curves
  for (const location of [...ERCOT_LOCATIONS, ...CAISO_LOCATIONS, ...ERCOT_MARKET_SERVICES, ...CAISO_MARKET_SERVICES]) {
    for (const curveType of location.curveTypes) {
      for (const granularity of GRANULARITIES) {
        for (const modelType of MODEL_TYPES) {
          await createCurveSchedule(
            location.name,
            'INTERNAL',
            'GST',
            curveType,
            granularity,
            modelType,
            location.importance,
            'MONTHLY'
          );
        }
      }
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 