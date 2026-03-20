const { Pool } = require('pg');

// Supabase connection configuration
// Use DATABASE_URL if available, otherwise fall back to individual parameters
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
});

// Alternative connection using individual parameters
const poolAlternative = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use the primary pool if DATABASE_URL is available, otherwise use alternative
const activePool = connectionString ? pool : poolAlternative;

// Test database connection
activePool.on('connect', () => {
  console.log('Connected to Supabase database');
});

activePool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Generic query function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await activePool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error', { text, error: error.message });
    throw error;
  }
};

// Transaction helper function
const transaction = async (callback) => {
  const client = await activePool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const result = await query('SELECT 1 as health_check');
    return result.rowCount > 0;
  } catch (error) {
    throw new Error('Database health check failed');
  }
};

// Graceful shutdown
const closePool = async () => {
  await activePool.end();
  console.log('Database connection pool closed');
};

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
  query,
  transaction,
  healthCheck,
  closePool,
  pool
};
