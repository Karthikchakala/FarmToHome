const supabase = require('../config/supabaseClient');

async function diagnoseFarmerProductsIssue() {
  try {
    console.log('🔍 Diagnosing farmer products issue...');
    
    // Test 1: Check if we can connect to Supabase
    console.log('\n📡 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.log('❌ Supabase connection failed:', testError.message);
      return;
    }
    console.log('✅ Supabase connection working');
    
    // Test 2: Check if there are any products at all
    console.log('\n📦 Checking all products in database...');
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('*')
      .limit(10);
      
    if (allProductsError) {
      console.log('❌ Error fetching all products:', allProductsError.message);
    } else {
      console.log(`📊 Found ${allProducts.length} total products in database`);
      if (allProducts.length > 0) {
        console.log('Sample product:', allProducts[0]);
      }
    }
    
    // Test 3: Check for the specific farmer's products
    const farmerId = '783c616a-12d2-4ae5-93e3-d6db4095fa9f';
    console.log(`\n👨‍🌾 Checking products for farmer: ${farmerId}`);
    
    const { data: farmerProducts, error: farmerProductsError } = await supabase
      .from('products')
      .select('*')
      .eq('farmerid', farmerId);
      
    if (farmerProductsError) {
      console.log('❌ Error fetching farmer products:', farmerProductsError.message);
    } else {
      console.log(`📊 Found ${farmerProducts.length} products for this farmer`);
      if (farmerProducts.length > 0) {
        console.log('Farmer products:', farmerProducts);
      } else {
        console.log('⚠️  No products found for this farmer');
      }
    }
    
    // Test 4: Check farmer record
    console.log('\n👤 Checking farmer record...');
    const userId = '0b87233e-908a-48a8-9b97-461ef11329b2';
    
    const { data: farmerRecord, error: farmerError } = await supabase
      .from('farmers')
      .select('*')
      .eq('userid', userId)
      .single();
      
    if (farmerError) {
      console.log('❌ Error finding farmer record:', farmerError.message);
    } else {
      console.log('✅ Farmer record found:', farmerRecord);
    }
    
    // Test 5: Try to simulate a product fetch like the API does
    console.log('\n🧪 Simulating API call...');
    
    if (farmerRecord) {
      const { data: apiProducts, error: apiError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('farmerid', farmerRecord._id)
        .order('createdat', { ascending: false })
        .range(0, 19);
        
      if (apiError) {
        console.log('❌ API simulation failed:', apiError.message);
      } else {
        console.log(`✅ API simulation successful: ${apiProducts.length} products found`);
        console.log('API response format:', {
          products: apiProducts,
          count: apiProducts.length
        });
      }
    }
    
    // Test 6: Check for constraint issues
    console.log('\n🔍 Checking for constraint issues...');
    
    // Try to insert a test product to see if constraint still exists
    const testProduct = {
      farmerid: farmerId,
      name: `test-diagnostic-${Date.now()}`,
      description: 'Diagnostic test product',
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
      console.log('❌ Constraint still exists:', insertError.message);
      console.log('🔧 This explains why farmer can\'t see products - they\'re not being saved!');
    } else {
      console.log('✅ Test product inserted successfully');
      console.log('🧹 Cleaning up test product...');
      
      await supabase
        .from('products')
        .delete()
        .eq('id', insertData[0].id);
        
      console.log('✅ Test product cleaned up');
      console.log('🎉 Constraint issue appears to be resolved!');
    }
    
    console.log('\n📋 Diagnosis Summary:');
    console.log('1. Supabase connection:', testError ? '❌ Failed' : '✅ Working');
    console.log('2. Total products:', allProducts?.length || 0);
    console.log('3. Farmer products:', farmerProducts?.length || 0);
    console.log('4. Farmer record:', farmerRecord ? '✅ Found' : '❌ Not found');
    console.log('5. Constraint issue:', insertError ? '❌ Still exists' : '✅ Resolved');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

// Run the diagnosis
if (require.main === module) {
  diagnoseFarmerProductsIssue()
    .then(() => {
      console.log('\n🚀 Diagnosis completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Diagnosis failed:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseFarmerProductsIssue };
