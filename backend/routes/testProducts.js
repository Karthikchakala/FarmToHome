const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Simple test endpoint to debug products
router.get('/test', async (req, res) => {
  try {
    console.log('Testing simple products query...');
    
    // Test 1: Simple query without joins
    const { data: simpleProducts, error: simpleError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    console.log('Simple query result:', { simpleProducts, simpleError });
    
    if (simpleError) {
      return res.status(500).json({
        success: false,
        error: 'Simple query failed',
        details: simpleError
      });
    }
    
    // Test 2: Query with farmer join
    const { data: joinedProducts, error: joinError } = await supabase
      .from('products')
      .select(`
        *,
        farmers!inner(
          userid,
          farmname
        )
      `)
      .limit(1);
    
    console.log('Join query result:', { joinedProducts, joinError });
    
    if (joinError) {
      return res.status(500).json({
        success: false,
        error: 'Join query failed',
        details: joinError
      });
    }
    
    // Test 3: Full query with all joins
    const { data: fullProducts, error: fullError } = await supabase
      .from('products')
      .select(`
        *,
        farmers!inner(
          userid,
          farmname,
          verificationstatus,
          ratingaverage,
          location,
          users!inner(
            name,
            email
          )
        )
      `)
      .limit(1);
    
    console.log('Full query result:', { fullProducts, fullError });
    
    if (fullError) {
      return res.status(500).json({
        success: false,
        error: 'Full query failed',
        details: fullError
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'All tests passed',
      data: {
        simpleCount: simpleProducts.length,
        joinedCount: joinedProducts.length,
        fullCount: fullProducts.length
      }
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

module.exports = router;
