// Migration: Convert enum fields to strings for flexibility
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration: Converting enums to strings...\n');

  try {
    // Step 1: Add new string columns
    console.log('Step 1: Adding new string columns...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Forecasts"."CurveDefinition" 
        ADD COLUMN IF NOT EXISTS "curveType_new" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "batteryDuration_new" VARCHAR(50),
        ADD COLUMN IF NOT EXISTS "scenario_new" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "degradationType_new" VARCHAR(100)
    `);
    console.log('✓ New columns added\n');

    // Step 2: Copy data from enum columns to string columns
    console.log('Step 2: Copying data from enum to string columns...');
    await prisma.$executeRawUnsafe(`
      UPDATE "Forecasts"."CurveDefinition"
      SET 
        "curveType_new" = "curveType"::text,
        "batteryDuration_new" = "batteryDuration"::text,
        "scenario_new" = "scenario"::text,
        "degradationType_new" = "degradationType"::text
    `);
    console.log('✓ Data copied\n');

    // Step 3: Drop dependent views first
    console.log('Step 3: Dropping dependent views...');
    await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS "Forecasts"."curves_by_type_and_scenario" CASCADE`);
    await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS "Forecasts"."delivery_management" CASCADE`);
    console.log('✓ Views dropped\n');

    // Step 4: Drop old enum columns
    console.log('Step 4: Dropping old enum columns...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Forecasts"."CurveDefinition"
        DROP COLUMN IF EXISTS "curveType",
        DROP COLUMN IF EXISTS "batteryDuration",
        DROP COLUMN IF EXISTS "scenario",
        DROP COLUMN IF EXISTS "degradationType"
    `);
    console.log('✓ Old columns dropped\n');

    // Step 5: Rename new columns to original names
    console.log('Step 5: Renaming new columns...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Forecasts"."CurveDefinition"
        RENAME COLUMN "curveType_new" TO "curveType"
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Forecasts"."CurveDefinition"
        RENAME COLUMN "batteryDuration_new" TO "batteryDuration"
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Forecasts"."CurveDefinition"
        RENAME COLUMN "scenario_new" TO "scenario"
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Forecasts"."CurveDefinition"
        RENAME COLUMN "degradationType_new" TO "degradationType"
    `);
    console.log('✓ Columns renamed\n');

    // Step 6: Set defaults
    console.log('Step 6: Setting defaults...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Forecasts"."CurveDefinition"
        ALTER COLUMN "curveType" SET DEFAULT 'REVENUE',
        ALTER COLUMN "batteryDuration" SET DEFAULT 'UNKNOWN',
        ALTER COLUMN "scenario" SET DEFAULT 'BASE',
        ALTER COLUMN "degradationType" SET DEFAULT 'NONE'
    `);
    console.log('✓ Defaults set\n');

    // Step 7: Make columns NOT NULL
    console.log('Step 7: Setting NOT NULL constraints...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Forecasts"."CurveDefinition"
        ALTER COLUMN "curveType" SET NOT NULL,
        ALTER COLUMN "batteryDuration" SET NOT NULL,
        ALTER COLUMN "scenario" SET NOT NULL,
        ALTER COLUMN "degradationType" SET NOT NULL
    `);
    console.log('✓ Constraints set\n');

    // Verify the migration
    console.log('Verifying migration...');
    const result = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'Forecasts'
        AND table_name = 'CurveDefinition'
        AND column_name IN ('curveType', 'batteryDuration', 'scenario', 'degradationType')
      ORDER BY column_name
    `;
    
    console.log('\n✓ Migration completed successfully!\n');
    console.log('Column details:');
    console.table(result);

    console.log('\n🎉 All fields are now flexible strings!');
    console.log('You can now enter custom values like "total revenue", "4HR BESS", etc.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();

