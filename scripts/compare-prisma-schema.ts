// Compare Prisma schema with actual database
// Usage: npx tsx scripts/compare-prisma-schema.ts

import { query } from '../src/lib/db';

console.log('🔍 Comparing Prisma Schema with Database...\n');
console.log('='.repeat(80));

async function compareSchemas() {
  const issues: string[] = [];
  const warnings: string[] = [];
  const good: string[] = [];
  
  try {
    // Check CurveDefinition
    console.log('\n📋 CurveDefinition:');
    console.log('-'.repeat(80));
    
    const defCols = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'Forecasts' AND table_name = 'CurveDefinition'
    `);
    const defColumns = defCols.rows.map(r => r.column_name);
    
    // Prisma expects these NOT to exist
    if (defColumns.includes('curveType')) {
      warnings.push('⚠️  CurveDefinition still has curveType column (can be dropped after verification)');
    } else {
      good.push('✅ CurveDefinition.curveType removed');
    }
    
    if (defColumns.includes('commodity')) {
      warnings.push('⚠️  CurveDefinition still has commodity column (can be dropped after verification)');
    } else {
      good.push('✅ CurveDefinition.commodity removed');
    }
    
    // Check CurveInstance
    console.log('\n📋 CurveInstance:');
    console.log('-'.repeat(80));
    
    const instCols = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'Forecasts' AND table_name = 'CurveInstance'
    `);
    const instColumns = instCols.rows.map(r => r.column_name);
    
    if (instColumns.includes('curveType')) {
      good.push('✅ CurveInstance.curveType exists');
    } else {
      issues.push('❌ CurveInstance.curveType MISSING!');
    }
    
    if (instColumns.includes('commodity')) {
      good.push('✅ CurveInstance.commodity exists');
    } else {
      issues.push('❌ CurveInstance.commodity MISSING!');
    }
    
    // Check CurveData structure
    console.log('\n📋 CurveData:');
    console.log('-'.repeat(80));
    
    const dataCols = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'Forecasts' AND table_name = 'CurveData'
    `);
    const dataColumns = dataCols.rows.map(r => r.column_name);
    
    // CurveData should have WIDE format (valueP5, valueP25, etc.)
    const expectedWideColumns = ['valueP5', 'valueP25', 'valueP50', 'valueP75', 'valueP95'];
    const hasAllWideColumns = expectedWideColumns.every(col => dataColumns.includes(col));
    
    if (hasAllWideColumns) {
      good.push('✅ CurveData has wide format columns (valueP5, valueP25, etc.)');
    } else {
      const missing = expectedWideColumns.filter(col => !dataColumns.includes(col));
      issues.push(`❌ CurveData missing wide format columns: ${missing.join(', ')}`);
    }
    
    // Check if it has OLD tall format columns
    if (dataColumns.includes('pValue') || dataColumns.includes('value')) {
      warnings.push('⚠️  CurveData has old tall format columns (pValue, value) - this is unexpected');
    }
    
    // Check PriceForecast structure
    console.log('\n📋 PriceForecast:');
    console.log('-'.repeat(80));
    
    const pfCols = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'Forecasts' AND table_name = 'PriceForecast'
    `);
    const pfColumns = pfCols.rows.map(r => r.column_name);
    
    // PriceForecast should have TALL format (pValue, value)
    if (pfColumns.includes('pValue') || pfColumns.includes('pvalue')) {
      good.push('✅ PriceForecast has tall format (pvalue column)');
    } else {
      issues.push('❌ PriceForecast missing pvalue column');
    }
    
    if (pfColumns.includes('value')) {
      good.push('✅ PriceForecast has value column');
    } else {
      issues.push('❌ PriceForecast missing value column');
    }
    
    // Check if it ALSO has wide format (which would be redundant but okay)
    const hasWideInPF = expectedWideColumns.every(col => pfColumns.includes(col));
    if (hasWideInPF) {
      warnings.push('⚠️  PriceForecast has BOTH tall and wide format - this is redundant but functional');
    }
    
    // Check Prisma schema expectations
    console.log('\n📋 Prisma Schema Alignment:');
    console.log('-'.repeat(80));
    
    // Prisma model CurveData expects: id, curveInstanceId, timestamp, pValue, value, flags
    // But our database has: id, curveInstanceId, timestamp, valueP5-95, flags
    const prismaExpectsTall = true; // Based on schema.prisma
    const databaseHasWide = hasAllWideColumns;
    
    if (prismaExpectsTall && databaseHasWide) {
      warnings.push('⚠️  MISMATCH: Prisma schema expects CurveData in tall format, but database has wide format');
      warnings.push('    → This is intentional for the migration. Prisma schema should be updated.');
    }
    
    // Check indexes
    console.log('\n📋 Index Check:');
    console.log('-'.repeat(80));
    
    const indexes = await query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'Forecasts'
        AND tablename IN ('CurveDefinition', 'CurveInstance')
      ORDER BY tablename, indexname
    `);
    
    const curveDefIndexes = indexes.rows.filter(i => i.tablename === 'CurveDefinition').map(i => i.indexname);
    const curveInstIndexes = indexes.rows.filter(i => i.tablename === 'CurveInstance').map(i => i.indexname);
    
    if (curveInstIndexes.some(i => i.includes('curveType') || i.includes('commodity'))) {
      good.push('✅ CurveInstance has index for curveType/commodity');
    } else {
      warnings.push('⚠️  CurveInstance missing index for curveType/commodity');
    }
    
    // Data verification
    console.log('\n📋 Data Integrity:');
    console.log('-'.repeat(80));
    
    const dataCheck = await query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT("curveType")::int as with_type,
        COUNT("commodity")::int as with_commodity
      FROM "Forecasts"."CurveInstance"
    `);
    
    const stats = dataCheck.rows[0];
    if (stats.total === stats.with_type && stats.total === stats.with_commodity) {
      good.push('✅ All CurveInstance rows have curveType and commodity populated');
    } else {
      issues.push(`❌ Data integrity issue: ${stats.total} instances but only ${stats.with_type} have curveType`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 AUDIT SUMMARY:\n');
    
    if (good.length > 0) {
      console.log('✅ Good (' + good.length + '):');
      good.forEach(g => console.log('  ' + g));
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  Warnings (' + warnings.length + '):');
      warnings.forEach(w => console.log('  ' + w));
      console.log('');
    }
    
    if (issues.length > 0) {
      console.log('❌ Issues (' + issues.length + '):');
      issues.forEach(i => console.log('  ' + i));
      console.log('');
    }
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:\n');
    
    if (warnings.some(w => w.includes('CurveDefinition still has'))) {
      console.log('1. Old columns on CurveDefinition can be safely dropped:');
      console.log('   ALTER TABLE "Forecasts"."CurveDefinition"');
      console.log('     DROP COLUMN IF EXISTS "curveType",');
      console.log('     DROP COLUMN IF EXISTS "commodity";');
      console.log('');
    }
    
    if (warnings.some(w => w.includes('Prisma schema expects'))) {
      console.log('2. Update Prisma schema for CurveData to match database (wide format):');
      console.log('   - Remove: pValue and value columns');
      console.log('   - Add: valueP5, valueP25, valueP50, valueP75, valueP95 columns');
      console.log('   - This will align Prisma with the actual database structure');
      console.log('');
    }
    
    if (issues.length === 0) {
      console.log('✅ No critical issues found! System is functioning correctly.');
    } else {
      console.log('⚠️  Critical issues need attention before proceeding.');
    }
    
    console.log('\n' + '='.repeat(80));
    
    return { issues, warnings, good };
    
  } catch (error) {
    console.error('\n❌ Comparison failed:', error);
    throw error;
  }
}

compareSchemas()
  .then(results => {
    process.exit(results.issues.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

