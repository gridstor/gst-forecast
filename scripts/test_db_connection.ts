import { Pool } from 'pg';
import { config } from '../src/config/database';

async function testConnection() {
  console.log('Testing database connection with config:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    // Not logging password for security
  });

  const pool = new Pool(config);

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('Successfully connected to database!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    client.release();
  } catch (err: any) {
    console.error('Connection failed with error:', err);
    if (err.code === 'ECONNREFUSED') {
      console.log('\nPossible solutions:');
      console.log('1. Verify PostgreSQL is running');
      console.log('2. Check if PostgreSQL is listening on port 5432');
      console.log('3. Ensure your firewall allows connections to PostgreSQL');
      console.log('4. Try setting POSTGRES_HOST to "localhost" instead of "127.0.0.1"');
      console.log('5. Check if the database "gst_forecast" exists');
    }
  } finally {
    await pool.end();
  }
}

// Run test
testConnection(); 