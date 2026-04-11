const supabase = require('./config/supabaseClient');

// Force Supabase client usage only - disable direct PostgreSQL connections
console.log('🚀 Using Supabase client exclusively for database operations');

// Mock pool object for compatibility with existing code
const mockPool = {
  query: async (text, params) => {
    throw new Error('Direct PostgreSQL queries are disabled. Please use Supabase client instead.');
  },
  connect: async () => {
    throw new Error('Direct PostgreSQL connections are disabled. Please use Supabase client instead.');
  },
  end: async () => {
    console.log('Mock pool closed (Supabase client is being used instead)');
  },
  on: (event, callback) => {
    if (event === 'error') {
      // Suppress error events for mock pool
    }
  }
};

const activePool = mockPool;

// Test database connection
activePool.on('connect', () => {
  console.log('Connected to Supabase database');
});

activePool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Generic query function using Supabase client
const query = async (text, params) => {
  const start = Date.now();
  
  try {
    // Parse the SQL query to determine the table and operation
    const trimmedQuery = text.trim().toLowerCase();
    
    // This is a simplified parser - in a real implementation, you'd want more sophisticated parsing
    if (trimmedQuery.startsWith('select')) {
      // For SELECT queries, we need to extract the table name
      const tableMatch = text.match(/from\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        console.log(`Using Supabase client for SELECT query on table: ${tableName}`);
        
        // Use Supabase client for the query
        const { data, error } = await supabase.from(tableName).select('*');
        
        if (error) {
          throw new Error(`Supabase query error: ${error.message}`);
        }
        
        const duration = Date.now() - start;
        console.log('Executed query via Supabase client', { text, duration, rows: data.length });
        
        // Return a mock result object compatible with existing code
        return {
          rows: data,
          rowCount: data.length
        };
      }
    }
    
    // For other operations or if we can't parse the query, throw an error
    throw new Error(`Direct PostgreSQL queries are disabled. Query: ${text}`);
    
  } catch (error) {
    console.error('Database query error', { text, error: error.message });
    throw error;
  }
};

// Transaction helper function - disabled for Supabase client
const transaction = async (callback) => {
  // Note: Supabase doesn't support traditional transactions in the same way
  // For now, we'll disable transactions and suggest using Supabase RPC functions
  throw new Error('Transactions are disabled when using Supabase client. Consider using Supabase RPC functions for complex operations.');
};

// Health check function using Supabase client
const healthCheck = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    
    if (error) {
      throw new Error(`Supabase health check failed: ${error.message}`);
    }
    
    console.log('✅ Supabase health check successful');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
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
  pool: activePool
};
