/**
 * Add LocationType field to CurveDefinition
 * 
 * This script adds the locationType enum and field to distinguish between
 * hub-level and nodal pricing locations for use in graphing and analysis.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding LocationType to CurveDefinition...\n');

  try {
    // Step 1: Create the enum (with error handling if it exists)
    console.log('📝 Creating LocationType enum...');
    try {
      await prisma.$executeRaw`
        CREATE TYPE "Forecasts"."LocationType" AS ENUM ('HUB', 'NODE')
      `;
      console.log('   ✅ Enum created');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('   ⚠️  Enum already exists, skipping');
      } else {
        throw error;
      }
    }

    // Step 2: Add the column (with error handling if it exists)
    console.log('📝 Adding locationType column...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Forecasts"."CurveDefinition" 
        ADD COLUMN "locationType" "Forecasts"."LocationType"
      `;
      console.log('   ✅ Column added');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('   ⚠️  Column already exists, skipping');
      } else {
        throw error;
      }
    }

    // Step 3: Populate NODE locations
    console.log('📝 Setting NODE locations...');
    const nodeResult = await prisma.$executeRaw`
      UPDATE "Forecasts"."CurveDefinition"
      SET "locationType" = 'NODE'::"Forecasts"."LocationType"
      WHERE location IN ('Goleta', 'Santa Fe Springs', 'Hidden Lakes', 'Gunnar', 'Odessa')
    `;
    console.log(`   ✅ Updated ${nodeResult} NODE locations`);

    // Step 4: Populate HUB locations (specific hubs)
    console.log('📝 Setting HUB locations...');
    const hubResult1 = await prisma.$executeRaw`
      UPDATE "Forecasts"."CurveDefinition"
      SET "locationType" = 'HUB'::"Forecasts"."LocationType"
      WHERE location IN ('SP15', 'NP15', 'Houston South', 'SPP North Hub', 'SPP South Hub')
    `;
    
    // Also handle variations
    const hubResult2 = await prisma.$executeRaw`
      UPDATE "Forecasts"."CurveDefinition"
      SET "locationType" = 'HUB'::"Forecasts"."LocationType"
      WHERE (location ILIKE '%north hub%' OR location ILIKE '%south hub%')
        AND "locationType" IS NULL
    `;
    
    // Set remaining to HUB
    const hubResult3 = await prisma.$executeRaw`
      UPDATE "Forecasts"."CurveDefinition"
      SET "locationType" = 'HUB'::"Forecasts"."LocationType"
      WHERE "locationType" IS NULL
    `;
    console.log(`   ✅ Updated ${Number(hubResult1) + Number(hubResult2) + Number(hubResult3)} HUB locations`);

    // Step 5: Create index (with error handling if it exists)
    console.log('📝 Creating index...');
    try {
      await prisma.$executeRaw`
        CREATE INDEX "idx_curvedefinition_locationtype" 
        ON "Forecasts"."CurveDefinition"("locationType")
      `;
      console.log('   ✅ Index created');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('   ⚠️  Index already exists, skipping');
      } else {
        throw error;
      }
    }

    // Step 6: Add comment
    console.log('📝 Adding documentation...');
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."CurveDefinition"."locationType" IS 
      'Distinguishes between hub-level (HUB) and nodal (NODE) pricing locations. Used in graphing and analysis to handle location-specific characteristics.'
    `;
    console.log('   ✅ Documentation added');

    console.log('\n✅ Migration completed successfully!\n');

    // Verify the results
    console.log('📊 Verifying location types...\n');
    
    const locationTypes = await prisma.$queryRaw<any[]>`
      SELECT 
        "locationType",
        COUNT(*) as count,
        array_agg(DISTINCT location ORDER BY location) as locations
      FROM "Forecasts"."CurveDefinition"
      GROUP BY "locationType"
      ORDER BY "locationType"
    `;

    console.log('Location Type Distribution:');
    locationTypes.forEach((row: any) => {
      console.log(`\n  ${row.locationType || 'NULL'}:`);
      console.log(`    Count: ${row.count}`);
      console.log(`    Locations: ${row.locations.join(', ')}`);
    });

    console.log('\n✨ LocationType field added successfully!');
    console.log('\n📌 Summary:');
    console.log('   • Created LocationType enum (HUB, NODE)');
    console.log('   • Added locationType column to CurveDefinition');
    console.log('   • Populated existing records with appropriate values');
    console.log('   • NODE: Goleta, Santa Fe Springs, Hidden Lakes, Gunnar, Odessa');
    console.log('   • HUB: All other locations (SP15, NP15, Houston South, etc.)');
    console.log('   • Created index for query performance\n');

  } catch (error: any) {
    console.error('\n❌ Error running migration:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('already exists')) {
      console.log('\n⚠️  Note: The LocationType enum or column may already exist.');
      console.log('   This is safe to ignore if you\'ve run this migration before.\n');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

