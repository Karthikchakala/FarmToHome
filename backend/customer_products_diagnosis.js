// Quick test for customer products issue
console.log('🔍 Customer Products Issue Diagnosis');

console.log('\n📋 Backend Response Format Check:');
console.log('Backend sends: { success: true, data: [products] }');
console.log('Frontend expects: response.data.data');
console.log('This should work correctly.');

console.log('\n🔍 Potential Issues:');

console.log('\n1. Location Filtering:');
console.log('- Customer products require location for nearby products');
console.log('- If no location, falls back to all products');
console.log('- But products might be filtered out if farmer has no location');

console.log('\n2. Farmer Location Missing:');
console.log('- Products exist: apple, Tomato');
console.log('- But farmer might not have latitude/longitude');
console.log('- Location filter removes products without location');

console.log('\n3. Product Availability:');
console.log('- Products must have isavailable = true');
console.log('- Stock must be > 0 for inStock filter');

console.log('\n🧪 Quick Test in Browser Console:');
console.log(`
// Test 1: Check if products API works
fetch('http://localhost:5005/api/products')
  .then(res => res.json())
  .then(data => console.log('All products:', data));

// Test 2: Check nearby products without location
fetch('http://localhost:5005/api/products/nearby')
  .then(res => res.json())
  .then(data => console.log('Nearby products:', data));

// Test 3: Check with location
fetch('http://localhost:5005/api/products?lat=19.0760&lng=72.8777')
  .then(res => res.json())
  .then(data => console.log('Products with location:', data));
`);

console.log('\n🔧 Most Likely Fix:');
console.log('1. Check if farmer has location data in database');
console.log('2. Update farmer location in Supabase');
console.log('3. Or modify location filter to handle missing locations');

console.log('\n📊 Database Check Needed:');
console.log('SELECT _id, farmname, location FROM farmers WHERE userid = \'farmer-user-id\';');
console.log('UPDATE farmers SET location = point(19.0760, 72.8777) WHERE userid = \'farmer-user-id\';');

console.log('\n🎯 Immediate Test:');
console.log('Open browser dev tools and test the fetch commands above');
console.log('This will show if the API is returning products correctly');
