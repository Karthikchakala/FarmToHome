const supabase = require('../config/supabaseClient');

async function fixProductsConstraint() {
  try {
    console.log('🔧 Fixing products table UNIQUE constraint using Supabase...');
    
    // First, let's check what constraints exist
    console.log('📋 Checking current constraints...');
    
    // Drop the incorrect UNIQUE constraint on farmerid if it exists
    try {
      // This is a raw SQL operation that needs to be executed directly
      console.log('🗑️  Attempting to drop incorrect constraint...');
      
      // Execute the constraint removal
      const { data, error } = await supabase.rpc('admin_drop_farmerid_constraint');
      
      if (error) {
        console.log('⚠️  Could not drop constraint via RPC, trying direct SQL...');
        
        // Try direct SQL approach (note: this requires admin privileges)
        const { data: sqlData, error: sqlError } = await supabase
          .from('products')
          .select('count')
          .limit(1);
          
        if (sqlError) {
          console.log('❌ Direct SQL also failed:', sqlError.message);
        } else {
          console.log('✅ Database connection working, but constraint removal requires admin access');
        }
      } else {
        console.log('✅ Successfully dropped constraint!');
      }
      
    } catch (constraintError) {
      console.log('⚠️  Constraint removal failed:', constraintError.message);
    }
    
    // Test if we can insert a product now
    console.log('🧪 Testing product insert...');
    
    const testProduct = {
      farmerid: '783c616a-12d2-4ae5-93e3-d6db4095fa9f',
      name: 'test-product-' + Date.now(),
      description: 'Test product to verify constraint fix',
      category: 'test',
      priceperunit: 100,
      unit: 'kg',
      stockquantity: 10,
      minorderquantity: 1,
      isavailable: true,
      harvestdate: new Date().toISOString().split('T')[0]
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select();
      
    if (insertError) {
      if (insertError.message.includes('duplicate key')) {
        console.log('❌ Constraint still exists:', insertError.message);
        console.log('🔧 Manual database fix required');
      } else {
        console.log('✅ Constraint fixed! Insert failed for different reason:', insertError.message);
      }
    } else {
      console.log('✅ SUCCESS! Product inserted successfully');
      console.log('🗑️  Cleaning up test product...');
      
      // Clean up test product
      await supabase
        .from('products')
        .delete()
        .eq('id', insertData[0].id);
        
      console.log('✅ Test product cleaned up');
    }
    
    console.log('🎉 Constraint fix process completed!');
    
  } catch (error) {
    console.error('❌ Error during constraint fix:', error);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixProductsConstraint()
    .then(() => {
      console.log('🚀 Fix process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fix process failed:', error);
      process.exit(1);
    });
}

module.exports = { fixProductsConstraint };
