import { Pool } from 'pg';
import { config } from '../../config/database';

const setupTestDatabase = async () => {
  const adminPool = new Pool({
    ...config,
    database: 'postgres' // Connect to default database first
  });

  try {
    // Drop test database if it exists
    await adminPool.query(`
      DROP DATABASE IF EXISTS test_${config.database}
    `);

    // Create fresh test database
    await adminPool.query(`
      CREATE DATABASE test_${config.database}
      WITH TEMPLATE ${config.database}
      OWNER ${config.user}
    `);

    // Close admin connection
    await adminPool.end();

    // Connect to test database to set up schema
    const testPool = new Pool({
      ...config,
      database: `test_${config.database}`
    });

    try {
      // Create schema if it doesn't exist
      await testPool.query(`
        CREATE SCHEMA IF NOT EXISTS Forecasts;
      `);

      // Create necessary tables with all required columns
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS Forecasts.curve_definitions (
          curve_id SERIAL PRIMARY KEY,
          mark_type VARCHAR(255) NOT NULL,
          mark_case VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          market VARCHAR(255) NOT NULL,
          granularity VARCHAR(50) NOT NULL,
          description TEXT,
          last_received_date TIMESTAMP WITH TIME ZONE,
          next_expected_date TIMESTAMP WITH TIME ZONE,
          freshness_start_date TIMESTAMP WITH TIME ZONE,
          freshness_end_date TIMESTAMP WITH TIME ZONE,
          is_currently_fresh BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS Forecasts.price_forecasts (
          id SERIAL PRIMARY KEY,
          curve_id INTEGER REFERENCES Forecasts.curve_definitions(curve_id),
          mark_date TIMESTAMP WITH TIME ZONE NOT NULL,
          flow_date_start TIMESTAMP WITH TIME ZONE NOT NULL,
          flow_date_end TIMESTAMP WITH TIME ZONE NOT NULL,
          price_value DECIMAL NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS Forecasts.curve_audit_log (
          id SERIAL PRIMARY KEY,
          curve_id INTEGER REFERENCES Forecasts.curve_definitions(curve_id),
          action_type VARCHAR(50) NOT NULL,
          action_metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        );

        CREATE TABLE IF NOT EXISTS Forecasts.curve_update_history (
          id SERIAL PRIMARY KEY,
          curve_id INTEGER REFERENCES Forecasts.curve_definitions(curve_id),
          update_type VARCHAR(50) NOT NULL,
          update_details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS Forecasts.curve_comments (
          id SERIAL PRIMARY KEY,
          curve_id INTEGER REFERENCES Forecasts.curve_definitions(curve_id),
          comment TEXT NOT NULL,
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } finally {
      await testPool.end();
    }
  } catch (error: any) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

// Run setup before tests
setupTestDatabase().catch(console.error); 