// Comprehensive database and schema audit
// Usage: npx tsx scripts/audit-database-schema.ts

import { query } from '../src/lib/db';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface TableInfo {
  table_name: string;
  columns: TableColumn[];
}

async function auditDatabase() {
  console.log('🔍 Starting Database Schema Audit...\n');
  console.log('='.repeat(80));
  
  try {
    // Get all tables in Forecasts schema
    console.log('\n📋 Step 1: Checking tables in Forecasts schema...\n');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'Forecasts'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t}`));
    
    // Get detailed info for key tables
    const keyTables = ['CurveDefinition', 'CurveInstance', 'CurveData', 'PriceForecast'];
    const tableDetails: Record<string, TableInfo> = {};
    
    console.log('\n📊 Step 2: Analyzing key table structures...\n');
    
    for (const tableName of keyTables) {
      const columnsResult = await query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'Forecasts' 
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      if (columnsResult.rows.length > 0) {
        tableDetails[tableName] = {
          table_name: tableName,
          columns: columnsResult.rows as TableColumn[]
        };
        
        console.log(`✅ ${tableName} (${columnsResult.rows.length} columns)`);
      } else {
        console.log(`❌ ${tableName} - NOT FOUND`);
      }
    }
    
    // Check indexes
    console.log('\n🔗 Step 3: Checking indexes...\n');
    const indexesResult = await query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'Forecasts'
        AND tablename IN ('CurveDefinition', 'CurveInstance', 'CurveData', 'PriceForecast')
      ORDER BY tablename, indexname
    `);
    
    console.log(`Found ${indexesResult.rows.length} indexes:`);
    indexesResult.rows.forEach(idx => {
      console.log(`  ${idx.tablename}.${idx.indexname}`);
    });
    
    // Check foreign keys
    console.log('\n🔑 Step 4: Checking foreign key relationships...\n');
    const fkResult = await query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'Forecasts'
        AND tc.table_name IN ('CurveDefinition', 'CurveInstance', 'CurveData', 'PriceForecast')
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log(`Found ${fkResult.rows.length} foreign keys:`);
    fkResult.rows.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Detailed column analysis
    console.log('\n' + '='.repeat(80));
    console.log('\n📝 Detailed Table Structures:\n');
    
    for (const [tableName, tableInfo] of Object.entries(tableDetails)) {
      console.log(`\n${tableName}:`);
      console.log('-'.repeat(80));
      console.log('Column'.padEnd(30) + 'Type'.padEnd(20) + 'Nullable'.padEnd(10) + 'Default');
      console.log('-'.repeat(80));
      
      tableInfo.columns.forEach(col => {
        const colName = col.column_name.padEnd(30);
        const dataType = col.data_type.padEnd(20);
        const nullable = col.is_nullable.padEnd(10);
        const defaultVal = col.column_default ? col.column_default.substring(0, 30) : 'NULL';
        console.log(`${colName}${dataType}${nullable}${defaultVal}`);
      });
    }
    
    // Check data counts
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 Data Counts:\n');
    
    for (const tableName of keyTables) {
      try {
        const countResult = await query(`SELECT COUNT(*)::int as count FROM "Forecasts"."${tableName}"`);
        const count = countResult.rows[0].count;
        console.log(`  ${tableName.padEnd(20)} ${count.toLocaleString().padStart(10)} rows`);
      } catch (err) {
        console.log(`  ${tableName.padEnd(20)} ERROR: ${err.message}`);
      }
    }
    
    // Check for migration-specific columns
    console.log('\n' + '='.repeat(80));
    console.log('\n✨ Migration Verification:\n');
    
    const curveInstanceColumns = tableDetails['CurveInstance']?.columns || [];
    const hasCurveType = curveInstanceColumns.some(c => c.column_name === 'curveType');
    const hasCommodity = curveInstanceColumns.some(c => c.column_name === 'commodity');
    
    console.log(`CurveInstance has curveType column: ${hasCurveType ? '✅ YES' : '❌ NO'}`);
    console.log(`CurveInstance has commodity column: ${hasCommodity ? '✅ YES' : '❌ NO'}`);
    
    if (hasCurveType && hasCommodity) {
      // Check if data is populated
      const dataCheck = await query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT("curveType")::int as with_type,
          COUNT("commodity")::int as with_commodity
        FROM "Forecasts"."CurveInstance"
      `);
      
      const stats = dataCheck.rows[0];
      console.log(`\nData population:`);
      console.log(`  Total instances: ${stats.total}`);
      console.log(`  With curveType: ${stats.with_type} (${stats.total === stats.with_type ? '✅' : '⚠️'})`);
      console.log(`  With commodity: ${stats.with_commodity} (${stats.total === stats.with_commodity ? '✅' : '⚠️'})`);
    }
    
    // Check CurveDefinition for old columns
    const curveDefColumns = tableDetails['CurveDefinition']?.columns || [];
    const defHasCurveType = curveDefColumns.some(c => c.column_name === 'curveType');
    const defHasCommodity = curveDefColumns.some(c => c.column_name === 'commodity');
    
    console.log(`\nCurveDefinition still has curveType column: ${defHasCurveType ? '⚠️ YES (can be dropped)' : '✅ NO'}`);
    console.log(`CurveDefinition still has commodity column: ${defHasCommodity ? '⚠️ YES (can be dropped)' : '✅ NO'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Audit Complete!\n');
    
    // Return audit results
    return {
      tables: tableDetails,
      indexes: indexesResult.rows,
      foreignKeys: fkResult.rows,
      migrationStatus: {
        instanceHasCurveType: hasCurveType,
        instanceHasCommodity: hasCommodity,
        definitionHasCurveType: defHasCurveType,
        definitionHasCommodity: defHasCommodity
      }
    };
    
  } catch (error) {
    console.error('\n❌ Audit failed:', error);
    throw error;
  }
}

// Run audit
auditDatabase()
  .then(results => {
    console.log('Audit results saved for comparison with Prisma schema.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Audit error:', error);
    process.exit(1);
  });

