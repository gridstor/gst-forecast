import type { APIRoute } from 'astro';
import { Pool } from 'pg';
import { config } from '../../config/database';

export const GET: APIRoute = async () => {
  // Use the configured database connection
  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    console.log('Connected to database');
    
    // Check both schemas
    const schemaCheck = await client.query(`
      SELECT 
        table_schema,
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE columns.table_schema = tables.table_schema 
         AND columns.table_name = tables.table_name) as column_count
      FROM information_schema.tables 
      WHERE table_name IN ('curve_schedule', 'curve_definitions', 'price_forecasts')
      AND table_schema IN ('public', 'Forecasts')
      ORDER BY table_schema, table_name;
    `);

    // Get row counts from Forecasts schema
    const forecastsCounts = await client.query(`
      SELECT 
        'curve_definitions' as table_name,
        COUNT(*) as row_count
      FROM "Forecasts".curve_definitions
      UNION ALL
      SELECT 
        'curve_schedule' as table_name,
        COUNT(*) as row_count
      FROM "Forecasts".curve_schedule
      UNION ALL
      SELECT 
        'price_forecasts' as table_name,
        COUNT(*) as row_count
      FROM "Forecasts".price_forecasts
      ORDER BY table_name;
    `);

    // Get sample data if exists
    const sampleSchedules = await client.query(`
      SELECT 
        schedule_id as id,
        curve_pattern,
        location,
        source_type,
        update_frequency,
        next_update_due
      FROM "Forecasts".curve_schedule
      LIMIT 5;
    `);

    const sampleCurves = await client.query(`
      SELECT 
        curve_id,
        mark_type,
        mark_case,
        location,
        market
      FROM "Forecasts".curve_definitions
      LIMIT 5;
    `);

    client.release();

    const response = {
      status: 'connected',
      database: {
        host: config.host,
        port: config.port,
        database: config.database,
        ssl: config.ssl ? 'enabled' : 'disabled'
      },
      schemas: schemaCheck.rows,
      rowCounts: forecastsCounts.rows,
      sampleSchedules: sampleSchedules.rows,
      sampleCurves: sampleCurves.rows,
      recommendation: forecastsCounts.rows.find(r => r.table_name === 'curve_schedule')?.row_count === '0' 
        ? 'The curve_schedule table is empty. Run: npm run populate-curves'
        : 'Data found in curve_schedule table'
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Analytics DB test error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check your .env file and ensure DATABASE_URL includes ?schema=Forecasts',
      connectionInfo: {
        host: config.host,
        port: config.port,
        database: config.database,
        ssl: config.ssl ? 'enabled' : 'disabled'
      }
    }, null, 2), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } finally {
    await pool.end();
  }
}; 