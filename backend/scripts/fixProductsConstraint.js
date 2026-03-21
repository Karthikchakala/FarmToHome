const { query } = require('../db');
const fs = require('fs');
const path = require('path');

async function fixProductsConstraint() {
  try {
    console.log('🔧 Fixing products table UNIQUE constraint...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'fix_products_constraint.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the fix
    await query(sql);
    
    console.log('✅ Products constraint fix completed successfully!');
    console.log('🎉 Farmers can now add multiple products!');
    
    // Verify the fix
    const result = await query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'products'
        AND tc.constraint_type = 'UNIQUE'
      ORDER BY tc.constraint_name
    `);
    
    console.log('📋 Current UNIQUE constraints on products table:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error fixing products constraint:', error);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixProductsConstraint()
    .then(() => {
      console.log('🚀 Fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixProductsConstraint };
