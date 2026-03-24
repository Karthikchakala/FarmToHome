# Subscription System Testing Guide

## 🚀 Setup Instructions

### 1. Database Migration
First, run the database migration to add the new subscription features:

```sql
-- Run this in Supabase SQL Editor
-- File: backend/migrations/update_subscriptions_schema.sql
```

### 2. Postman Setup
1. Import the Postman collection: `backend/postman/Subscription_API_Testing.postman_collection.json`
2. Set the following environment variables:
   - `baseUrl`: `http://localhost:5005`
   - `consumerToken`: Get from login API (consumer role)
   - `farmerToken`: Get from login API (farmer role)
   - `adminToken`: Get from login API (admin role)
   - `productId`: A valid product ID from your database
   - `subscriptionId`: Will be set automatically after creating subscription

### 3. Get Authentication Tokens
```bash
# Consumer Login
POST http://localhost:5005/api/auth/login
{
  "email": "consumer@example.com",
  "password": "password123"
}

# Farmer Login
POST http://localhost:5005/api/auth/login
{
  "email": "farmer@example.com",
  "password": "password123"
}

# Admin Login
POST http://localhost:5005/api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

## 📋 Testing Scenarios

### **Scenario 1: Create a Subscription**
1. **Request**: `POST /api/subscriptions`
2. **Body**:
```json
{
  "productId": "your-product-uuid",
  "frequency": "WEEKLY",
  "deliveryDay": "MONDAY",
  "quantity": 2,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "requireApproval": true
}
```
3. **Expected Response**:
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "_id": "subscription-uuid",
      "status": "ACTIVE",
      "nextDeliveryDate": "2026-03-31",
      "requireApproval": true
    }
  }
}
```

### **Scenario 2: Get User Subscriptions**
1. **Request**: `GET /api/subscriptions?status=ACTIVE`
2. **Expected Response**: List of user's subscriptions with product details

### **Scenario 3: Modify Subscription**
1. **Request**: `PUT /api/subscriptions/{id}/modify`
2. **Body**:
```json
{
  "quantity": 3,
  "frequency": "BIWEEKLY",
  "deliveryDay": "WEDNESDAY",
  "requireApproval": false
}
```
3. **Expected Response**: Updated subscription details

### **Scenario 4: Skip Specific Delivery**
1. **Request**: `POST /api/subscriptions/{id}/skip`
2. **Body**:
```json
{
  "skipDate": "2026-03-31",
  "reason": "Out of town"
}
```
3. **Expected Response**: Success message

### **Scenario 5: Approve/ Skip Upcoming Delivery**
1. **Request**: `POST /api/subscriptions/{id}/approve`
2. **Body**:
```json
{
  "approve": true,
  "notes": "Please deliver as scheduled"
}
```
3. **Expected Response**: Delivery approved

### **Scenario 6: Pause/Resume Subscription**
1. **Pause**: `PATCH /api/subscriptions/{id}/status` with `{"status": "PAUSED"}`
2. **Resume**: `PATCH /api/subscriptions/{id}/status` with `{"status": "ACTIVE"}`

### **Scenario 7: Cancel Subscription**
1. **Request**: `PATCH /api/subscriptions/{id}/status`
2. **Body**: `{"status": "CANCELLED"}`

### **Scenario 8: Farmer View Subscriptions**
1. **Request**: `GET /api/subscriptions/farmer` (with farmer token)
2. **Expected Response**: List of subscriptions for farmer's products

### **Scenario 9: Admin Analytics**
1. **Request**: `GET /api/subscriptions/admin/analytics` (with admin token)
2. **Expected Response**: Subscription statistics

## 🔄 Testing Subscription Processing

### Manual Testing:
1. Create a subscription with `nextDeliveryDate` = today
2. Run the subscription processor manually:
```bash
cd backend
node -e "require('./jobs/subscriptionProcessor').processSubscriptions()"
```
3. Check if:
   - Order was created (if no approval required)
   - Pending approval was created (if approval required)
   - Delivery record was created
   - Next delivery date was updated

### Automatic Testing:
The processor runs daily at 9:00 AM and midnight. Check logs:
```bash
tail -f backend/logs/app.log
```

## 📊 Database Verification

### Check Subscriptions:
```sql
SELECT * FROM "public"."subscriptions" WHERE consumerid = 'your-consumer-id';
```

### Check Delivery Records:
```sql
SELECT * FROM "public"."subscription_deliveries" WHERE subscriptionid = 'your-subscription-id';
```

### Check Skip Records:
```sql
SELECT * FROM "public"."subscription_skips" WHERE subscriptionid = 'your-subscription-id';
```

## 🚨 Common Issues & Solutions

### Issue 1: "Consumer profile not found"
**Solution**: Ensure the user has a consumer record:
```sql
INSERT INTO "public"."consumers" (userid, name) 
VALUES ('user-uuid', 'User Name');
```

### Issue 2: "Product not found or not available"
**Solution**: Check if product exists and is available:
```sql
SELECT _id, isavailable FROM "public"."products" WHERE _id = 'your-product-id';
```

### Issue 3: "Invalid frequency"
**Solution**: Use only: 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'DAILY'

### Issue 4: "Invalid delivery day"
**Solution**: Use only: 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'

## 📝 Test Data

### Sample Product:
```json
{
  "productId": "98a0e4ff-f5bf-4a16-9bc3-123456789012",
  "name": "Fresh Tomatoes",
  "pricePerUnit": 25,
  "unit": "kg",
  "isAvailable": true
}
```

### Sample Subscription:
```json
{
  "productId": "98a0e4ff-f5bf-4a16-9bc3-123456789012",
  "frequency": "WEEKLY",
  "deliveryDay": "MONDAY",
  "quantity": 2,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  },
  "requireApproval": true
}
```

## ✅ Success Criteria

- [ ] Subscription created successfully
- [ ] Subscription details retrieved correctly
- [ ] Subscription modified successfully
- [ ] Delivery skipped successfully
- [ ] Delivery approved/skipped successfully
- [ ] Subscription paused/resumed successfully
- [ ] Subscription cancelled successfully
- [ ] Farmer can view their subscriptions
- [ ] Admin can view all subscriptions and analytics
- [ ] Automatic order creation works (when approval not required)
- [ ] Approval request works (when approval required)
- [ ] Skip functionality works
- [ ] Next delivery date updated correctly

## 📞 Support

If you encounter issues:
1. Check backend logs: `backend/logs/app.log`
2. Verify database schema is updated
3. Ensure all environment variables are set
4. Check authentication tokens are valid
