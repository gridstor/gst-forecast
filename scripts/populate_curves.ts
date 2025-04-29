import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CurveConfig = [string, string, number]; // [pattern, type, importance]

async function populateCurveSchedule() {
  try {
    // First, clear existing data
    console.log('Clearing existing data...');
    await prisma.curveComment.deleteMany();
    await prisma.curveReceipt.deleteMany();
    await prisma.curveUpdateHistory.deleteMany();
    await prisma.curveSchedule.deleteMany();

    // Helper function to create a curve schedule
    async function createCurveSchedule(
      curvePattern: string,
      location: string,
      sourceType: string,
      provider: string,
      granularity: string,
      modelType: string | null,
      updateFrequency: string,
      updateDay: number,
      responsibleTeam: string,
      description: string,
      importance: number
    ) {
      return prisma.curveSchedule.create({
        data: {
          curvePattern,
          location,
          sourceType,
          provider,
          granularity,
          modelType,
          updateFrequency,
          updateDay,
          responsibleTeam,
          description,
          importance,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // ERCOT Market - External Curves
    console.log('Creating ERCOT external curves...');
    
    // Define all ERCOT locations and their curves
    const ercotLocations = {
      'Odessa': 'ERCOT-Odessa',
      'Hidden Lakes': 'ERCOT-Hidden Lakes',
      'Gunner Noodles': 'ERCOT-Gunner Noodles',
      'Houston Hub': 'ERCOT-Houston Hub',
      'South Hub': 'ERCOT-South Hub',
      'West Hub': 'ERCOT-West Hub'
    };

    // Define curve types for each location
    const locationCurveTypes: Record<string, CurveConfig[]> = {};
    
    // Add curves for each location
    for (const [locName, locValue] of Object.entries(ercotLocations)) {
      locationCurveTypes[locValue] = [
        [`AURORA_${locValue.replace('-', '_')}_ENERGY_ARB`, 'Energy Arbitrage', 4],
        [`AURORA_${locValue.replace('-', '_')}_ANC_SERVICES`, 'Ancillary Services', 4],
        [`AURORA_${locValue.replace('-', '_')}_TOTAL_REVENUE`, 'Total Revenue', 5],
        [`AURORA_${locValue.replace('-', '_')}_TB2_ENERGY`, 'TB2 Energy', 3]
      ];
    }

    // Create curves for all ERCOT locations
    for (const [location, curves] of Object.entries(locationCurveTypes)) {
      console.log(`Creating curves for ${location}...`);
      for (const [pattern, type, importance] of curves) {
        for (const granularity of ['ANNUAL', 'MONTHLY']) {
          await createCurveSchedule(
            pattern,
            location,
            'EXTERNAL',
            'Aurora',
            granularity,
            null,
            'QUARTERLY',
            1,
            'Market Analysis',
            `Aurora ${location} ${type}`,
            importance
          );
        }
      }
    }

    // ERCOT Market-wide services
    const ercotMarketServices: CurveConfig[] = [
      ['AURORA_ERCOT_WIDE_REG_UP', 'Regulation Up', 5],
      ['AURORA_ERCOT_WIDE_REG_DOWN', 'Regulation Down', 5],
      ['AURORA_ERCOT_WIDE_ECRS', 'ECRS', 5]
    ];

    console.log('Creating ERCOT market-wide services...');
    for (const [pattern, type, importance] of ercotMarketServices) {
      for (const granularity of ['ANNUAL', 'MONTHLY']) {
        await createCurveSchedule(
          pattern,
          'ERCOT-Wide',
          'EXTERNAL',
          'Aurora',
          granularity,
          null,
          'QUARTERLY',
          1,
          'Market Analysis',
          `Aurora ERCOT-wide ${type}`,
          importance
        );
      }
    }

    // CAISO Market - External Curves
    console.log('Creating CAISO external curves...');
    
    // Define CAISO locations
    const caisoLocations = {
      'Goleta': 'CAISO-Goleta',
      'SFS Noodles': 'CAISO-SFS Noodles',
      'SP15 Hub': 'CAISO-SP15 Hub',
      'NP15 Hub': 'CAISO-NP15 Hub'
    };

    // Add curves for each CAISO location
    const caisoLocationCurveTypes: Record<string, CurveConfig[]> = {};
    
    for (const [locName, locValue] of Object.entries(caisoLocations)) {
      caisoLocationCurveTypes[locValue] = [
        [`AURORA_${locValue.replace('-', '_')}_ENERGY_ARB`, 'Energy Arbitrage', 4],
        [`AURORA_${locValue.replace('-', '_')}_ANC_SERVICES`, 'Ancillary Services', 4],
        [`AURORA_${locValue.replace('-', '_')}_TOTAL_REVENUE`, 'Total Revenue', 5],
        [`AURORA_${locValue.replace('-', '_')}_TB4_ENERGY`, 'TB4 Energy', 3]
      ];
    }

    // Create curves for all CAISO locations
    for (const [location, curves] of Object.entries(caisoLocationCurveTypes)) {
      console.log(`Creating curves for ${location}...`);
      for (const [pattern, type, importance] of curves) {
        for (const granularity of ['ANNUAL', 'MONTHLY']) {
          await createCurveSchedule(
            pattern,
            location,
            'EXTERNAL',
            'Aurora',
            granularity,
            null,
            'QUARTERLY',
            1,
            'Market Analysis',
            `Aurora ${location} ${type}`,
            importance
          );
        }
      }
    }

    // CAISO Market-wide services
    const caisoMarketServices: CurveConfig[] = [
      ['AURORA_CAISO_WIDE_REG_UP', 'Regulation Up', 5],
      ['AURORA_CAISO_WIDE_REG_DOWN', 'Regulation Down', 5],
      ['AURORA_CAISO_WIDE_SPIN', 'Spin', 5],
      ['AURORA_CAISO_WIDE_NON_SPIN', 'Non-Spin', 5],
      ['AURORA_CAISO_RA', 'Resource Adequacy', 5]
    ];

    console.log('Creating CAISO market-wide services...');
    for (const [pattern, type, importance] of caisoMarketServices) {
      for (const granularity of ['ANNUAL', 'MONTHLY']) {
        await createCurveSchedule(
          pattern,
          'CAISO-Wide',
          'EXTERNAL',
          'Aurora',
          granularity,
          null,
          'QUARTERLY',
          1,
          'Market Analysis',
          `Aurora CAISO-wide ${type}`,
          importance
        );
      }
    }

    // Create internal GST curves
    console.log('Creating internal GST curves...');
    const modelTypes = ['HISTORICAL', 'QUANTITATIVE', 'FUNDAMENTALS'];

    // Create internal curves for all locations and market services
    for (const [location, curves] of Object.entries({...locationCurveTypes, ...caisoLocationCurveTypes})) {
      for (const [pattern, type, importance] of curves) {
        for (const granularity of ['ANNUAL', 'MONTHLY']) {
          for (const modelType of modelTypes) {
            const gstPattern = pattern.replace('AURORA', 'GST');
            await createCurveSchedule(
              gstPattern,
              location,
              'INTERNAL',
              'GST',
              granularity,
              modelType,
              'MONTHLY',
              15,
              'Market Analysis',
              `GST ${location} ${type} - ${modelType}`,
              importance
            );
          }
        }
      }
    }

    // Create internal curves for market-wide services
    for (const services of [ercotMarketServices, caisoMarketServices]) {
      for (const [pattern, type, importance] of services) {
        for (const granularity of ['ANNUAL', 'MONTHLY']) {
          for (const modelType of modelTypes) {
            const gstPattern = pattern.replace('AURORA', 'GST');
            const location = pattern.includes('ERCOT') ? 'ERCOT-Wide' : 'CAISO-Wide';
            await createCurveSchedule(
              gstPattern,
              location,
              'INTERNAL',
              'GST',
              granularity,
              modelType,
              'MONTHLY',
              15,
              'Market Analysis',
              `GST ${location} ${type} - ${modelType}`,
              importance
            );
          }
        }
      }
    }

    console.log('Successfully populated curve schedule data!');
  } catch (error) {
    console.error('Error populating curve schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateCurveSchedule()
  .catch(console.error); 