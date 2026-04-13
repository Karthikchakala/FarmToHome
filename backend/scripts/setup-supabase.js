#!/usr/bin/env node

// Supabase database setup/check script.
// This version uses the Supabase client for verification instead of a raw
// postgres connection string. It can confirm whether the smart-agri tables
// exist, but the SQL migration still needs to be applied in Supabase SQL
// editor or through your preferred migration workflow.

require('dotenv').config();
const supabase = require('../config/supabaseClient');

const REQUIRED_TABLES = ['users', 'fields', 'plant_scans'];

const checkTable = async (tableName) => {
  const { error } = await supabase.from(tableName).select('*').limit(1);
  if (!error) {
    return { table: tableName, exists: true };
  }

  const text = `${error.code || ''} ${error.message || ''}`.toLowerCase();
  if (error.code === 'PGRST205' || text.includes('schema cache') || text.includes('could not find the table')) {
    return { table: tableName, exists: false, error };
  }

  throw error;
};

const verifySetup = async () => {
  console.log('🔍 Verifying Supabase tables via Supabase client...');

  const results = [];
  for (const table of REQUIRED_TABLES) {
    try {
      const result = await checkTable(table);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error checking ${table}:`, error.message);
      throw error;
    }
  }

  const missing = results.filter((item) => !item.exists);
  if (missing.length) {
    console.warn('⚠️ Missing tables detected:', missing.map((item) => item.table).join(', '));
    console.warn('Apply the migration in Supabase SQL editor using:');
    console.warn('  backend/database/migrations/2026-04-12-smart-agri-features.sql');
  } else {
    console.log('✅ All required smart-agri tables are available.');
  }

  console.log('✅ Supabase verification complete');
  return {
    tables: results,
    missing: missing.map((item) => item.table)
  };
};

const setupSupabase = async () => {
  try {
    console.log('🚀 Starting Supabase setup check for Farm to Table...');
    console.log(`📍 Supabase URL: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);
    console.log(`🔑 Service role key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Not configured'}`);

    const { error } = await supabase.from('users').select('_id').limit(1);
    if (error) {
      throw error;
    }
    console.log('✅ Supabase client connection successful');

    await verifySetup();

    console.log('🎉 Setup check completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. If any tables are missing, apply the migration in Supabase SQL editor');
    console.log('2. Restart the backend');
    console.log('3. Re-run this script to confirm the tables are present');
  } catch (error) {
    console.error('❌ Setup check failed:', error.message);
    process.exitCode = 1;
  }
};

if (require.main === module) {
  setupSupabase();
}

module.exports = {
  setupSupabase,
  verifySetup
};
