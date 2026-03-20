#!/usr/bin/env node

// Supabase Database Setup Script
// This script helps set up the Farm to Table database schema on Supabase

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// SQL schema files
const schemaFiles = [
  '01-users.sql',
  '02-products.sql',
  '03-orders.sql',
  '04-subscriptions.sql',
  '05-notifications.sql',
  '06-reviews.sql',
  '07-chat.sql',
  '08-indexes.sql'
];

// Execute SQL file
const executeSQLFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✅ Executed: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
    throw error;
  }
};

// Enable PostGIS extensions
const enablePostGIS = async () => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis_topology');
    console.log('✅ PostGIS extensions enabled');
  } catch (error) {
    console.error('❌ Failed to enable PostGIS:', error.message);
    throw error;
  }
};

// Create database schema
const createSchema = async () => {
  try {
    console.log('🗄️  Creating database schema...');
    
    // Enable PostGIS
    await enablePostGIS();
    
    // Execute schema files
    for (const file of schemaFiles) {
      const filePath = path.join(__dirname, '../schema', file);
      if (fs.existsSync(filePath)) {
        await executeSQLFile(filePath);
      } else {
        console.warn(`⚠️  Schema file not found: ${file}`);
      }
    }
    
    console.log('✅ Database schema created successfully');
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    throw error;
  }
};

// Verify setup
const verifySetup = async () => {
  try {
    console.log('🔍 Verifying database setup...');
    
    // Check tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const result = await pool.query(tablesQuery);
    const tables = result.rows.map(row => row.table_name);
    
    console.log('📋 Tables created:', tables);
    
    // Check PostGIS is enabled
    const postgisCheck = await pool.query('SELECT PostGIS_Version()');
    console.log('🗺️  PostGIS version:', postgisCheck.rows[0].postgis_version);
    
    // Check indexes
    const indexesQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `;
    
    const indexes = await pool.query(indexesQuery);
    console.log(`📊 Created ${indexes.rows.length} indexes`);
    
    console.log('✅ Database verification complete');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
};

// Main setup function
const setupSupabase = async () => {
  try {
    console.log('🚀 Starting Supabase setup for Farm to Table...');
    console.log(`📍 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');
    
    // Create schema
    await createSchema();
    
    // Verify setup
    await verifySetup();
    
    console.log('🎉 Supabase setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with actual Supabase credentials');
    console.log('2. Run: npm start to start the server');
    console.log('3. Visit: http://localhost:5000/health to verify');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run setup if called directly
if (require.main === module) {
  setupSupabase();
}

module.exports = {
  setupSupabase,
  createSchema,
  verifySetup,
  enablePostGIS
};
