// Quick debug test for customer profile issues
console.log('🔍 Starting Customer Profile Debug Test');

// Test 1: Basic profile fetch
console.log('\n📋 Test 1: Basic Profile Fetch');
console.log('Request: GET /api/profile');
console.log('Expected: Should return customer profile data');

// Test 2: Profile with different tokens
console.log('\n📋 Test 2: Token Validation');
console.log('Customer Token: {{customer_token}}');
console.log('Farmer Token: {{farmer_token}}');
console.log('Note: Make sure you are using customer token, not farmer token');

// Test 3: Direct consumer data check
console.log('\n📋 Test 3: Manual Database Check');
console.log('Run this SQL in Supabase to verify consumer exists:');
console.log(`
SELECT _id, userid, defaultaddressstreet, defaultaddresscity, latitude, longitude 
FROM consumers 
WHERE userid = '0a7b48ff-a9a1-451f-b6a0-43c1a50d77cf';
`);

// Test 4: Location update preparation
console.log('\n📋 Test 4: Location Update Prep');
console.log('Request Body for location update:');
console.log(JSON.stringify({
  latitude: 19.0760,
  longitude: 72.8777,
  address: {
    street: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001"
  }
}, null, 2));

// Test 5: Expected API responses
console.log('\n📋 Test 5: Expected Responses');
console.log('Profile API should return:');
console.log(`{
  "success": true,
  "data": {
    "_id": "0a7b48ff-a9a1-451f-b6a0-43c1a50d77cf",
    "consumers": { ... }
  }
}`);

console.log('Location update should return:');
console.log(`{
  "success": true,
  "data": {
    "location": { "latitude": 19.0760, "longitude": 72.8777 },
    "message": "Location updated successfully"
  }
}`);

console.log('\n🔍 Debugging Checklist:');
console.log('1. Check backend console for detailed error logs');
console.log('2. Verify Supabase connection in backend');
console.log('3. Check if consumer record exists in database');
console.log('4. Test with valid customer token');
console.log('5. Check network tab in browser for request failures');

console.log('\n📞 If still failing:');
console.log('- Share exact backend console output');
console.log('- Share exact Postman error response');
console.log('- Check if Supabase is connected in backend');
console.log('- Verify customer user exists in database');

console.log('\n🎯 Success Indicators:');
console.log('✅ Profile API returns success: true');
console.log('✅ Location update returns success: true');
console.log('✅ Customer products page shows products');
console.log('✅ Nearby products API returns 2 products');

console.log('\n🚀 Test Sequence:');
console.log('1. Test profile API → Check console logs');
console.log('2. If profile works → Test location update');
console.log('3. If location works → Test customer products page');
console.log('4. If products show → Success!');
