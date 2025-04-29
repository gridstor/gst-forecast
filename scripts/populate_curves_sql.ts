import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateCurveSchedule() {
  try {
    console.log('Clearing existing data...');
    
    // Clear existing data using raw SQL
    await prisma.$executeRaw`DELETE FROM "Forecasts"."curve_comment"`;
    await prisma.$executeRaw`DELETE FROM "Forecasts"."curve_receipt"`;
    await prisma.$executeRaw`DELETE FROM "Forecasts"."curve_update_history"`;
    await prisma.$executeRaw`DELETE FROM "Forecasts"."curve_schedule"`;

    // ========================================================================
    // EXTERNAL CURVES (AURORA) - ERCOT MARKET
    // ========================================================================
    console.log('Creating ERCOT external curves...');

    // ERCOT - Odessa
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- Odessa - Annual
      ('AURORA_ERCOT_ODESSA_ENERGY_ARB', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_ODESSA_ANC_SERVICES', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_ODESSA_TOTAL_REVENUE', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_ODESSA_TB2_ENERGY', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa TB2 Energy', 3,
       NOW(), NOW()),
      -- Odessa - Monthly
      ('AURORA_ERCOT_ODESSA_ENERGY_ARB', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_ODESSA_ANC_SERVICES', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_ODESSA_TOTAL_REVENUE', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_ODESSA_TB2_ENERGY', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa TB2 Energy', 3,
       NOW(), NOW())
    `;

    // ERCOT - Hidden Lakes
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- Hidden Lakes - Annual
      ('AURORA_ERCOT_HIDDEN_LAKES_ENERGY_ARB', 'ERCOT-Hidden Lakes', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Hidden Lakes Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_HIDDEN_LAKES_ANC_SERVICES', 'ERCOT-Hidden Lakes', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Hidden Lakes Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_HIDDEN_LAKES_TOTAL_REVENUE', 'ERCOT-Hidden Lakes', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Hidden Lakes Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_HIDDEN_LAKES_TB2_ENERGY', 'ERCOT-Hidden Lakes', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Hidden Lakes TB2 Energy', 3,
       NOW(), NOW()),
      -- Hidden Lakes - Monthly
      ('AURORA_ERCOT_HIDDEN_LAKES_ENERGY_ARB', 'ERCOT-Hidden Lakes', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Hidden Lakes Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_HIDDEN_LAKES_ANC_SERVICES', 'ERCOT-Hidden Lakes', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Hidden Lakes Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_HIDDEN_LAKES_TOTAL_REVENUE', 'ERCOT-Hidden Lakes', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Hidden Lakes Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_HIDDEN_LAKES_TB2_ENERGY', 'ERCOT-Hidden Lakes', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Hidden Lakes TB2 Energy', 3,
       NOW(), NOW())
    `;

    // ERCOT - Gunner Noodles
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- Gunner Noodles - Annual
      ('AURORA_ERCOT_GUNNER_NOODLES_ENERGY_ARB', 'ERCOT-Gunner Noodles', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Gunner Noodles Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_GUNNER_NOODLES_ANC_SERVICES', 'ERCOT-Gunner Noodles', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Gunner Noodles Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_GUNNER_NOODLES_TOTAL_REVENUE', 'ERCOT-Gunner Noodles', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Gunner Noodles Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_GUNNER_NOODLES_TB2_ENERGY', 'ERCOT-Gunner Noodles', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Gunner Noodles TB2 Energy', 3,
       NOW(), NOW()),
      -- Gunner Noodles - Monthly
      ('AURORA_ERCOT_GUNNER_NOODLES_ENERGY_ARB', 'ERCOT-Gunner Noodles', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Gunner Noodles Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_GUNNER_NOODLES_ANC_SERVICES', 'ERCOT-Gunner Noodles', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Gunner Noodles Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_GUNNER_NOODLES_TOTAL_REVENUE', 'ERCOT-Gunner Noodles', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Gunner Noodles Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_GUNNER_NOODLES_TB2_ENERGY', 'ERCOT-Gunner Noodles', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Gunner Noodles TB2 Energy', 3,
       NOW(), NOW())
    `;

    console.log('Successfully populated ERCOT external curves!');
    console.log('Adding more curves...');

    // ERCOT - Houston Hub
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- Houston Hub - Annual
      ('AURORA_ERCOT_HOUSTON_HUB_ENERGY_ARB', 'ERCOT-Houston Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Houston Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_HOUSTON_HUB_ANC_SERVICES', 'ERCOT-Houston Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Houston Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_HOUSTON_HUB_TOTAL_REVENUE', 'ERCOT-Houston Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Houston Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_HOUSTON_HUB_TB2_ENERGY', 'ERCOT-Houston Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Houston Hub TB2 Energy', 3,
       NOW(), NOW()),
      -- Houston Hub - Monthly
      ('AURORA_ERCOT_HOUSTON_HUB_ENERGY_ARB', 'ERCOT-Houston Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Houston Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_HOUSTON_HUB_ANC_SERVICES', 'ERCOT-Houston Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Houston Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_HOUSTON_HUB_TOTAL_REVENUE', 'ERCOT-Houston Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Houston Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_HOUSTON_HUB_TB2_ENERGY', 'ERCOT-Houston Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Houston Hub TB2 Energy', 3,
       NOW(), NOW())
    `;

    // ERCOT - South Hub
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- South Hub - Annual
      ('AURORA_ERCOT_SOUTH_HUB_ENERGY_ARB', 'ERCOT-South Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT South Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_SOUTH_HUB_ANC_SERVICES', 'ERCOT-South Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT South Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_SOUTH_HUB_TOTAL_REVENUE', 'ERCOT-South Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT South Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_SOUTH_HUB_TB2_ENERGY', 'ERCOT-South Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT South Hub TB2 Energy', 3,
       NOW(), NOW()),
      -- South Hub - Monthly
      ('AURORA_ERCOT_SOUTH_HUB_ENERGY_ARB', 'ERCOT-South Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT South Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_SOUTH_HUB_ANC_SERVICES', 'ERCOT-South Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT South Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_SOUTH_HUB_TOTAL_REVENUE', 'ERCOT-South Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT South Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_SOUTH_HUB_TB2_ENERGY', 'ERCOT-South Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT South Hub TB2 Energy', 3,
       NOW(), NOW())
    `;

    // ERCOT - West Hub
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- West Hub - Annual
      ('AURORA_ERCOT_WEST_HUB_ENERGY_ARB', 'ERCOT-West Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT West Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_WEST_HUB_ANC_SERVICES', 'ERCOT-West Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT West Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_WEST_HUB_TOTAL_REVENUE', 'ERCOT-West Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT West Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_WEST_HUB_TB2_ENERGY', 'ERCOT-West Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT West Hub TB2 Energy', 3,
       NOW(), NOW()),
      -- West Hub - Monthly
      ('AURORA_ERCOT_WEST_HUB_ENERGY_ARB', 'ERCOT-West Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT West Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_WEST_HUB_ANC_SERVICES', 'ERCOT-West Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT West Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_ERCOT_WEST_HUB_TOTAL_REVENUE', 'ERCOT-West Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT West Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_WEST_HUB_TB2_ENERGY', 'ERCOT-West Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT West Hub TB2 Energy', 3,
       NOW(), NOW())
    `;

    // ERCOT - Market-wide Ancillary Services
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- Market-wide Services - Annual
      ('AURORA_ERCOT_WIDE_REG_UP', 'ERCOT-Wide', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT-wide Regulation Up', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_WIDE_REG_DOWN', 'ERCOT-Wide', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT-wide Regulation Down', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_WIDE_ECRS', 'ERCOT-Wide', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT-wide ECRS', 5,
       NOW(), NOW()),
      -- Market-wide Services - Monthly
      ('AURORA_ERCOT_WIDE_REG_UP', 'ERCOT-Wide', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT-wide Regulation Up', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_WIDE_REG_DOWN', 'ERCOT-Wide', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT-wide Regulation Down', 5,
       NOW(), NOW()),
      ('AURORA_ERCOT_WIDE_ECRS', 'ERCOT-Wide', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT-wide ECRS', 5,
       NOW(), NOW())
    `;

    console.log('Successfully populated ERCOT market curves!');
    console.log('Adding CAISO curves next...');

    // ========================================================================
    // EXTERNAL CURVES (AURORA) - CAISO MARKET
    // ========================================================================
    console.log('Creating CAISO external curves...');

    // CAISO - Goleta
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- Goleta - Annual
      ('AURORA_CAISO_GOLETA_ENERGY_ARB', 'CAISO-Goleta', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Goleta Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_GOLETA_ANC_SERVICES', 'CAISO-Goleta', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Goleta Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_GOLETA_TOTAL_REVENUE', 'CAISO-Goleta', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Goleta Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_GOLETA_TB4_ENERGY', 'CAISO-Goleta', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Goleta TB4 Energy', 3,
       NOW(), NOW()),
      -- Goleta - Monthly
      ('AURORA_CAISO_GOLETA_ENERGY_ARB', 'CAISO-Goleta', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Goleta Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_GOLETA_ANC_SERVICES', 'CAISO-Goleta', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Goleta Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_GOLETA_TOTAL_REVENUE', 'CAISO-Goleta', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Goleta Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_GOLETA_TB4_ENERGY', 'CAISO-Goleta', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Goleta TB4 Energy', 3,
       NOW(), NOW())
    `;

    // CAISO - SFS Noodles
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- SFS Noodles - Annual
      ('AURORA_CAISO_SFS_NOODLES_ENERGY_ARB', 'CAISO-SFS Noodles', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SFS Noodles Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_SFS_NOODLES_ANC_SERVICES', 'CAISO-SFS Noodles', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SFS Noodles Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_SFS_NOODLES_TOTAL_REVENUE', 'CAISO-SFS Noodles', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SFS Noodles Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_SFS_NOODLES_TB4_ENERGY', 'CAISO-SFS Noodles', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SFS Noodles TB4 Energy', 3,
       NOW(), NOW()),
      -- SFS Noodles - Monthly
      ('AURORA_CAISO_SFS_NOODLES_ENERGY_ARB', 'CAISO-SFS Noodles', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SFS Noodles Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_SFS_NOODLES_ANC_SERVICES', 'CAISO-SFS Noodles', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SFS Noodles Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_SFS_NOODLES_TOTAL_REVENUE', 'CAISO-SFS Noodles', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SFS Noodles Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_SFS_NOODLES_TB4_ENERGY', 'CAISO-SFS Noodles', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SFS Noodles TB4 Energy', 3,
       NOW(), NOW())
    `;

    // CAISO - SP15 Hub
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- SP15 Hub - Annual
      ('AURORA_CAISO_SP15_HUB_ENERGY_ARB', 'CAISO-SP15 Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SP15 Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_SP15_HUB_ANC_SERVICES', 'CAISO-SP15 Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SP15 Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_SP15_HUB_TOTAL_REVENUE', 'CAISO-SP15 Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SP15 Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_SP15_HUB_TB4_ENERGY', 'CAISO-SP15 Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SP15 Hub TB4 Energy', 3,
       NOW(), NOW()),
      -- SP15 Hub - Monthly
      ('AURORA_CAISO_SP15_HUB_ENERGY_ARB', 'CAISO-SP15 Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SP15 Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_SP15_HUB_ANC_SERVICES', 'CAISO-SP15 Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SP15 Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_SP15_HUB_TOTAL_REVENUE', 'CAISO-SP15 Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SP15 Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_SP15_HUB_TB4_ENERGY', 'CAISO-SP15 Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO SP15 Hub TB4 Energy', 3,
       NOW(), NOW())
    `;

    // CAISO - NP15 Hub
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- NP15 Hub - Annual
      ('AURORA_CAISO_NP15_HUB_ENERGY_ARB', 'CAISO-NP15 Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO NP15 Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_NP15_HUB_ANC_SERVICES', 'CAISO-NP15 Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO NP15 Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_NP15_HUB_TOTAL_REVENUE', 'CAISO-NP15 Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO NP15 Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_NP15_HUB_TB4_ENERGY', 'CAISO-NP15 Hub', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO NP15 Hub TB4 Energy', 3,
       NOW(), NOW()),
      -- NP15 Hub - Monthly
      ('AURORA_CAISO_NP15_HUB_ENERGY_ARB', 'CAISO-NP15 Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO NP15 Hub Energy Arbitrage', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_NP15_HUB_ANC_SERVICES', 'CAISO-NP15 Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO NP15 Hub Ancillary Services', 4,
       NOW(), NOW()),
      ('AURORA_CAISO_NP15_HUB_TOTAL_REVENUE', 'CAISO-NP15 Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO NP15 Hub Total Revenue', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_NP15_HUB_TB4_ENERGY', 'CAISO-NP15 Hub', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO NP15 Hub TB4 Energy', 3,
       NOW(), NOW())
    `;

    // CAISO - Market-wide Ancillary Services and RA
    await prisma.$executeRaw`
      INSERT INTO "Forecasts"."curve_schedule" (
        curve_pattern, location, source_type, provider, granularity, 
        update_frequency, update_day, responsible_team, description, importance,
        created_at, updated_at
      ) VALUES 
      -- Market-wide Services - Annual
      ('AURORA_CAISO_WIDE_REG_UP', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO-wide Regulation Up', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_WIDE_REG_DOWN', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO-wide Regulation Down', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_WIDE_SPIN', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO-wide Spin', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_WIDE_NON_SPIN', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO-wide Non-Spin', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_RA', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'ANNUAL', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Resource Adequacy', 5,
       NOW(), NOW()),
      -- Market-wide Services - Monthly
      ('AURORA_CAISO_WIDE_REG_UP', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO-wide Regulation Up', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_WIDE_REG_DOWN', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO-wide Regulation Down', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_WIDE_SPIN', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO-wide Spin', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_WIDE_NON_SPIN', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO-wide Non-Spin', 5,
       NOW(), NOW()),
      ('AURORA_CAISO_RA', 'CAISO-Wide', 'EXTERNAL', 'Aurora', 'MONTHLY', 
       'QUARTERLY', 1, 'Market Analysis', 'Aurora CAISO Resource Adequacy', 5,
       NOW(), NOW())
    `;

    console.log('Successfully populated CAISO market curves!');
    console.log('Adding internal GST curves next...');

    // ========================================================================
    // INTERNAL CURVES (GST) - HISTORICAL MODELING
    // ========================================================================
    console.log('Creating internal GST curves with historical modeling...');

    // Function to create GST curves for a location
    async function createGSTCurves(location: string, modelType: string, tb: string = 'TB2') {
      await prisma.$executeRaw`
        INSERT INTO "Forecasts"."curve_schedule" (
          curve_pattern, location, source_type, provider, granularity, 
          model_type, update_frequency, update_day, responsible_team, description, importance,
          created_at, updated_at
        ) VALUES 
        -- Annual curves
        ('GST_${location}_ENERGY_ARB', ${location}, 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ${location} Energy Arbitrage - ${modelType}', 4,
         NOW(), NOW()),
        ('GST_${location}_ANC_SERVICES', ${location}, 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ${location} Ancillary Services - ${modelType}', 4,
         NOW(), NOW()),
        ('GST_${location}_TOTAL_REVENUE', ${location}, 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ${location} Total Revenue - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_${location}_${tb}_ENERGY', ${location}, 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ${location} ${tb} Energy - ${modelType}', 3,
         NOW(), NOW()),
        -- Monthly curves
        ('GST_${location}_ENERGY_ARB', ${location}, 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ${location} Energy Arbitrage - ${modelType}', 4,
         NOW(), NOW()),
        ('GST_${location}_ANC_SERVICES', ${location}, 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ${location} Ancillary Services - ${modelType}', 4,
         NOW(), NOW()),
        ('GST_${location}_TOTAL_REVENUE', ${location}, 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ${location} Total Revenue - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_${location}_${tb}_ENERGY', ${location}, 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ${location} ${tb} Energy - ${modelType}', 3,
         NOW(), NOW())
      `;
    }

    // ERCOT Locations
    const ercotLocations = [
      'ERCOT-Odessa',
      'ERCOT-Hidden Lakes',
      'ERCOT-Gunner Noodles',
      'ERCOT-Houston Hub',
      'ERCOT-South Hub',
      'ERCOT-West Hub'
    ];

    // CAISO Locations
    const caisoLocations = [
      'CAISO-Goleta',
      'CAISO-SFS Noodles',
      'CAISO-SP15 Hub',
      'CAISO-NP15 Hub'
    ];

    // Create curves for all model types
    const modelTypes = ['HISTORICAL', 'QUANTITATIVE', 'FUNDAMENTALS'];

    // Create curves for ERCOT locations
    for (const location of ercotLocations) {
      for (const modelType of modelTypes) {
        await createGSTCurves(location, modelType, 'TB2');
      }
    }

    // Create curves for CAISO locations
    for (const location of caisoLocations) {
      for (const modelType of modelTypes) {
        await createGSTCurves(location, modelType, 'TB4');
      }
    }

    // Create market-wide service curves for ERCOT
    for (const modelType of modelTypes) {
      await prisma.$executeRaw`
        INSERT INTO "Forecasts"."curve_schedule" (
          curve_pattern, location, source_type, provider, granularity, 
          model_type, update_frequency, update_day, responsible_team, description, importance,
          created_at, updated_at
        ) VALUES 
        -- Annual curves
        ('GST_ERCOT_WIDE_REG_UP', 'ERCOT-Wide', 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ERCOT-wide Regulation Up - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_ERCOT_WIDE_REG_DOWN', 'ERCOT-Wide', 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ERCOT-wide Regulation Down - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_ERCOT_WIDE_ECRS', 'ERCOT-Wide', 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ERCOT-wide ECRS - ${modelType}', 5,
         NOW(), NOW()),
        -- Monthly curves
        ('GST_ERCOT_WIDE_REG_UP', 'ERCOT-Wide', 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ERCOT-wide Regulation Up - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_ERCOT_WIDE_REG_DOWN', 'ERCOT-Wide', 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ERCOT-wide Regulation Down - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_ERCOT_WIDE_ECRS', 'ERCOT-Wide', 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST ERCOT-wide ECRS - ${modelType}', 5,
         NOW(), NOW())
      `;
    }

    // Create market-wide service curves for CAISO
    for (const modelType of modelTypes) {
      await prisma.$executeRaw`
        INSERT INTO "Forecasts"."curve_schedule" (
          curve_pattern, location, source_type, provider, granularity, 
          model_type, update_frequency, update_day, responsible_team, description, importance,
          created_at, updated_at
        ) VALUES 
        -- Annual curves
        ('GST_CAISO_WIDE_REG_UP', 'CAISO-Wide', 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO-wide Regulation Up - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_CAISO_WIDE_REG_DOWN', 'CAISO-Wide', 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO-wide Regulation Down - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_CAISO_WIDE_SPIN', 'CAISO-Wide', 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO-wide Spin - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_CAISO_WIDE_NON_SPIN', 'CAISO-Wide', 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO-wide Non-Spin - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_CAISO_RA', 'CAISO-Wide', 'INTERNAL', 'GST', 'ANNUAL', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO Resource Adequacy - ${modelType}', 5,
         NOW(), NOW()),
        -- Monthly curves
        ('GST_CAISO_WIDE_REG_UP', 'CAISO-Wide', 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO-wide Regulation Up - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_CAISO_WIDE_REG_DOWN', 'CAISO-Wide', 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO-wide Regulation Down - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_CAISO_WIDE_SPIN', 'CAISO-Wide', 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO-wide Spin - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_CAISO_WIDE_NON_SPIN', 'CAISO-Wide', 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO-wide Non-Spin - ${modelType}', 5,
         NOW(), NOW()),
        ('GST_CAISO_RA', 'CAISO-Wide', 'INTERNAL', 'GST', 'MONTHLY', 
         ${modelType}, 'MONTHLY', 15, 'Market Analysis', 'GST CAISO Resource Adequacy - ${modelType}', 5,
         NOW(), NOW())
      `;
    }

    console.log('Successfully populated all curve schedule data!');
  } catch (error) {
    console.error('Error populating curve schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateCurveSchedule()
  .catch(console.error); 