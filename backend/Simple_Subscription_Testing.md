# Simple Subscription Testing Guide

## 🔑 Step 1: Get Authentication Token

### Login as Consumer (vighneshprasad12@gmail.com)
```bash
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vighneshprasad12@gmail.com",
    "password": "your-password"
  }'
```
Copy the `token` from response - this is your **CONSUMER_TOKEN**

### Login as Farmer
```bash
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-farmer-email@gmail.com",
    "password": "your-password"
  }'
```
Copy the `token` from response - this is your **FARMER_TOKEN**

## 📦 Step 2: Get a Product ID

Run this in Supabase SQL Editor:
```sql
SELECT _id, name, priceperunit FROM "public"."products" 
WHERE isavailable = true 
LIMIT 1;
```
Copy the `_id` - this is your **PRODUCT_ID**

## ➕ Step 3: Create a Subscription

Replace `CONSUMER_TOKEN` and `PRODUCT_ID` with your values:

```bash
curl -X POST http://localhost:5005/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CONSUMER_TOKEN" \
  -d '{
    "productId": "PRODUCT_ID",
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
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "_id": "subscription-uuid-here",
      "status": "ACTIVE",
      "nextDeliveryDate": "2026-03-31"
    }
  }
}
```
Copy the `_id` - this is your **SUBSCRIPTION_ID**

## 👀 Step 4: View Your Subscription (Consumer)

```bash
curl -X GET "http://localhost:5005/api/subscriptions?status=ACTIVE" \
  -H "Authorization: Bearer CONSUMER_TOKEN"
```

## 👨‍🌾 Step 5: Farmer Views Subscriptions

```bash
curl -X GET "http://localhost:5005/api/subscriptions/farmer?status=ACTIVE" \
  -H "Authorization: Bearer FARMER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "_id": "subscription-uuid",
        "consumerName": "Customer Name",
        "productName": "Tomatoes",
        "quantity": 2,
        "frequency": "WEEKLY",
        "nextDeliveryDate": "2026-03-31",
        "status": "ACTIVE"
      }
    ]
  }
}
```

## ⚙️ Step 6: Manage Subscription (Consumer)

### Modify Subscription
```bash
curl -X PUT http://localhost:5005/api/subscriptions/SUBSCRIPTION_ID/modify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CONSUMER_TOKEN" \
  -d '{
    "quantity": 3,
    "frequency": "BIWEEKLY",
    "deliveryDay": "WEDNESDAY"
  }'
```

### Skip a Delivery
```bash
curl -X POST http://localhost:5005/api/subscriptions/SUBSCRIPTION_ID/skip \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CONSUMER_TOKEN" \
  -d '{
    "skipDate": "2026-03-31",
    "reason": "Out of town"
  }'
```

### Approve Upcoming Delivery
```bash
curl -X POST http://localhost:5005/api/subscriptions/SUBSCRIPTION_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CONSUMER_TOKEN" \
  -d '{
    "approve": true,
    "notes": "Please deliver as scheduled"
  }'
```

### Pause Subscription
```bash
curl -X PATCH http://localhost:5005/api/subscriptions/SUBSCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CONSUMER_TOKEN" \
  -d '{
    "status": "PAUSED"
  }'
```

### Resume Subscription
```bash
curl -X PATCH http://localhost:5005/api/subscriptions/SUBSCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CONSUMER_TOKEN" \
  -d '{
    "status": "ACTIVE"
  }'
```

### Cancel Subscription
```bash
curl -X PATCH http://localhost:5005/api/subscriptions/SUBSCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CONSUMER_TOKEN" \
  -d '{
    "status": "CANCELLED"
  }'
```

## 🔄 Step 7: Test Subscription Processing

The system automatically processes subscriptions daily at 9 AM. To test manually:

1. Create a subscription with `nextDeliveryDate` = today
2. Set `requireApproval: false` for automatic order creation
3. Run this in backend terminal:
```bash
cd backend
node -e "const { SubscriptionProcessor } = require('./jobs/subscriptionProcessor'); const processor = new SubscriptionProcessor(); processor.processSubscriptions();"
```
4. Check if an order was created in the database

## 📊 Step 8: Check Database

### View Subscriptions
```sql
SELECT * FROM "public"."subscriptions" ORDER BY createdat DESC;
```

### View Delivery Records
```sql
SELECT * FROM "public"."subscription_deliveries" ORDER BY createdat DESC;
```

### View Skip Records
```sql
SELECT * FROM "public"."subscription_skips" ORDER BY createdat DESC;
```

## ✅ Success Criteria

- [ ] Subscription created successfully
- [ ] Consumer can view their subscriptions
- [ ] Farmer can view subscriptions for their products
- [ ] Subscription can be modified
- [ ] Delivery can be skipped
- [ ] Delivery can be approved
- [ ] Subscription can be paused/resumed
- [ ] Subscription can be cancelled

## 🚨 Common Errors

**401 Unauthorized**: Check your token is correct and not expired
**403 Forbidden**: Wrong user role (consumer vs farmer)
**404 Not Found**: Product or subscription ID doesn't exist
**400 Bad Request**: Invalid frequency or delivery day

## 📝 Test Values Example

```bash
CONSUMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
FARMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PRODUCT_ID="98a0e4ff-f5bf-4a16-9bc3-123456789012"
SUBSCRIPTION_ID="subscription-uuid-from-create-response"
```

Replace these with your actual values when testing!
