// Supabase configuration and utilities
require('dotenv').config();

const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
  
  // PostGIS extension configuration
  postgis: {
    enabled: true,
    version: '3.3'
  },
  
  // Connection pool settings
  pool: {
    min: 2,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },
  
  // SSL configuration for Supabase
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
};

// Validate Supabase configuration
const validateSupabaseConfig = () => {
  const required = ['url', 'anonKey', 'serviceRoleKey', 'databaseUrl'];
  const missing = required.filter(key => !supabaseConfig[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Supabase configuration: ${missing.join(', ')}`);
  }
  
  return true;
};

// Get Supabase connection string
const getSupabaseConnectionString = () => {
  if (supabaseConfig.databaseUrl) {
    return supabaseConfig.databaseUrl;
  }
  
  throw new Error('DATABASE_URL not configured');
};

// Supabase-specific query helpers
const supabaseHelpers = {
  // Enable PostGIS extension
  enablePostGIS: async (query) => {
    try {
      await query('CREATE EXTENSION IF NOT EXISTS postgis');
      await query('CREATE EXTENSION IF NOT EXISTS postgis_topology');
      console.log('PostGIS extensions enabled');
    } catch (error) {
      console.error('Failed to enable PostGIS extensions:', error);
      throw error;
    }
  },
  
  // Create spatial indexes
  createSpatialIndexes: async (query) => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_farmers_location ON farmers USING GIST (location)',
      'CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_userid_createdat ON notifications (userid, createdat DESC)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_nextdelivery ON subscriptions (nextdeliverydate) WHERE status = \'ACTIVE\''
    ];
    
    for (const indexSql of indexes) {
      try {
        await query(indexSql);
        console.log(`Created index: ${indexSql.split('idx_')[1].split(' ')[0]}`);
      } catch (error) {
        console.warn(`Index creation warning: ${error.message}`);
      }
    }
  },
  
  // Get database version and PostGIS version
  getDatabaseInfo: async (query) => {
    try {
      const [pgVersion, postgisVersion] = await Promise.all([
        query('SELECT version()'),
        query('SELECT PostGIS_Version()')
      ]);
      
      return {
        postgresql: pgVersion.rows[0].version,
        postgis: postgisVersion.rows[0].postgis_version
      };
    } catch (error) {
      console.error('Failed to get database info:', error);
      return null;
    }
  }
};

module.exports = {
  supabaseConfig,
  validateSupabaseConfig,
  getSupabaseConnectionString,
  supabaseHelpers
};
