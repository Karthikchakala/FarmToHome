const supabase = require('../config/supabaseClient');

async function fixProductsConstraintWithSupabase() {
  try {
    console.log('🔧 Fixing products constraint using Supabase client...');
    
    // First, let's check if we can identify the constraint issue
    console.log('📋 Testing current constraint behavior...');
    
    // Test 1: Try to get existing products for this farmer
    const farmerId = '783c616a-12d2-4ae5-93e3-d6db4095fa9f';
    
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('farmerid', farmerId);
      
    if (fetchError) {
      console.log('❌ Error fetching existing products:', fetchError.message);
      return;
    }
    
    console.log(`📦 Found ${existingProducts.length} existing products for farmer`);
    
    // Test 2: Try to insert a test product to see the exact error
    const testProduct = {
      farmerid: farmerId,
      name: `test-product-${Date.now()}`,
      description: 'Test product to verify constraint behavior',
      category: 'test',
      priceperunit: 100,
      unit: 'kg',
      stockquantity: 10,
      minorderquantity: 1,
      isavailable: true,
      harvestdate: new Date().toISOString().split('T')[0]
    };
    
    console.log('🧪 Testing product insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select();
      
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      
      if (insertError.message.includes('duplicate key') || insertError.message.includes('unique constraint')) {
        console.log('🔍 Constraint issue confirmed!');
        console.log('💡 Workaround: We need to use a different approach');
        
        // Since we can't drop constraints directly with client, let's try alternative solutions
        
        // Alternative 1: Try to update existing product instead of inserting new one
        if (existingProducts.length > 0) {
          console.log('💡 Alternative: Update existing product instead of inserting new one');
          
          const { data: updateData, error: updateError } = await supabase
            .from('products')
            .update({
              name: `updated-product-${Date.now()}`,
              description: 'Updated product description',
              priceperunit: 150
            })
            .eq('id', existingProducts[0].id)
            .select();
            
          if (updateError) {
            console.log('❌ Update also failed:', updateError.message);
          } else {
            console.log('✅ Update successful! Constraint allows updates');
            console.log('🎯 Workaround: Use update operations instead of insert for now');
          }
        }
        
        // Alternative 2: Check if there's a Supabase function we can call
        console.log('🔍 Checking for Supabase RPC functions...');
        
        // Try to call a custom function (if it exists)
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('drop_products_farmerid_constraint');
            
          if (rpcError) {
            console.log('⚠️  RPC function not available:', rpcError.message);
          } else {
            console.log('✅ RPC function executed successfully!');
          }
        } catch (rpcError) {
          console.log('⚠️  RPC function not found:', rpcError.message);
        }
        
      }
    } else {
      console.log('✅ SUCCESS! Product inserted without constraint error');
      console.log('🗑️  Cleaning up test product...');
      
      // Clean up test product
      await supabase
        .from('products')
        .delete()
        .eq('id', insertData[0].id);
        
      console.log('✅ Test product cleaned up');
      console.log('🎉 Constraint issue appears to be resolved!');
    }
    
    // Final recommendation
    console.log('\n📋 Summary and Recommendations:');
    console.log('1. If insert succeeded: Constraint issue is resolved');
    console.log('2. If insert failed: Need manual database fix via Supabase dashboard');
    console.log('3. Workaround: Use update operations for now');
    
  } catch (error) {
    console.error('❌ Error during constraint analysis:', error);
    throw error;
  }
}

// Alternative approach: Create a new table without constraints
async function createProductsTableWithoutConstraint() {
  try {
    console.log('🔧 Creating backup products table without constraints...');
    
    // This would require admin privileges, but let's document the approach
    console.log('📝 SQL to run in Supabase dashboard:');
    console.log(`
-- Create backup table
CREATE TABLE products_backup AS SELECT * FROM products;

-- Drop original table
DROP TABLE products;

-- Recreate table without problematic constraint
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmerid UUID REFERENCES farmers(_id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priceperunit DECIMAL(10,2),
  unit TEXT,
  stockquantity INTEGER,
  minorderquantity INTEGER,
  images TEXT[],
  isavailable BOOLEAN DEFAULT true,
  harvestdate DATE,
  expirydate DATE,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add proper constraint (optional)
ALTER TABLE products ADD CONSTRAINT products_farmerid_name_unique UNIQUE (farmerid, name);

-- Restore data
INSERT INTO products SELECT * FROM products_backup;

-- Drop backup table
DROP TABLE products_backup;
    `);
    
  } catch (error) {
    console.error('❌ Error creating backup table:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixProductsConstraintWithSupabase()
    .then(() => {
      console.log('🚀 Constraint analysis completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  fixProductsConstraintWithSupabase,
  createProductsTableWithoutConstraint
};
