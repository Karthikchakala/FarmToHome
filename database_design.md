# DETAILED DATABASE DESIGN DOCUMENT
## Farm to Table – PostgreSQL Schema Design (Production-Level)

---

# 1. USERS COLLECTION

Purpose: Stores authentication and identity data for all system users.

Fields:
- _id (UUID, Primary Key)
- name (String, required)
- email (String, required, unique, indexed)
- phone (String, required, unique, indexed)
- passwordHash (String, required)
- role (String, enum: ['farmer','consumer','admin'], required, indexed)
- isVerified (Boolean, default: false)
- isBanned (Boolean, default: false)
- profileImageUrl (String)
- lastLoginAt (Date)
- createdAt (Date, indexed)
- updatedAt (Date)

Indexes:
- Unique index on email
- Unique index on phone
- Index on role

---

# 2. FARMERS COLLECTION

Purpose: Extends user profile for farmers.

Fields:
- _id (UUID)
- userId (UUID, ref: Users, required, indexed)
- farmName (String, required)
- description (String)
- farmingType (String, enum: ['organic','natural','mixed'])
- location (GEOGRAPHY(Point,4326))
  - type: "Point"
  - coordinates: [longitude (Number), latitude (Number)]
- deliveryRadius (Number, meters, default: 5000)
- verificationStatus (String, enum: ['pending','approved','rejected'], indexed)
- ratingAverage (Number, default: 0)
- totalReviews (Number, default: 0)
- totalSales (Number, default: 0)
- commissionRate (Number, percentage, default: 5)
- createdAt (Date)
- updatedAt (Date)

Indexes:
- PostGIS spatial index on location
- Index on verificationStatus
- Index on userId

---

# 3. CONSUMERS COLLECTION

Purpose: Extended profile for consumers.

Fields:
- _id (UUID)
- userId (UUID, ref: Users, required, indexed)
- defaultAddress (Embedded Object)
  - street (String)
  - city (String)
  - state (String)
  - postalCode (String)
  - location (GEOGRAPHY(Point,4326) Point)
- walletBalance (Number, default: 0)
- totalOrders (Number, default: 0)
- createdAt (Date)
- updatedAt (Date)

Indexes:
- Index on userId

---

# 4. PRODUCTS COLLECTION

Purpose: Stores farmer-listed products.

Fields:
- _id (UUID)
- farmerId (UUID, ref: Farmers, required, indexed)
- name (String, required, indexed)
- description (String)
- category (String, indexed)
- unit (String, enum: ['kg','gram','litre','piece'])
- pricePerUnit (Number, required)
- stockQuantity (Number, required)
- minOrderQuantity (Number)
- images (Array of String URLs)
- isAvailable (Boolean, default: true, indexed)
- harvestDate (Date)
- expiryDate (Date)
- createdAt (Date)
- updatedAt (Date)

Indexes:
- Compound index: farmerId + isAvailable
- Index on category

---

# 5. ORDERS COLLECTION

Purpose: Stores all consumer orders.

Fields:
- _id (UUID)
- orderNumber (String, unique, indexed)
- consumerId (UUID, ref: Consumers, indexed)
- farmerId (UUID, ref: Farmers, indexed)
- items (Array of Embedded Objects)
  - productId (UUID)
  - productName (String snapshot)
  - quantity (Number)
  - pricePerUnit (Number snapshot)
  - subtotal (Number)
- totalAmount (Number)
- platformCommission (Number)
- deliveryCharge (Number)
- finalAmount (Number)
- deliveryAddress (Embedded Object)
- status (String, enum: ['PLACED','CONFIRMED','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','CANCELLED','FAILED','DISPUTED'], indexed)
- paymentStatus (String, enum: ['PENDING','PAID','FAILED','REFUNDED'], indexed)
- paymentMethod (String, enum: ['COD','ONLINE','WALLET'])
- orderType (String, enum: ['one-time','subscription'])
- deliveredAt (Date)
- createdAt (Date, indexed)
- updatedAt (Date)

Indexes:
- Index on consumerId
- Index on farmerId
- Index on status
- Index on paymentStatus

---

# 6. ORDERITEMS COLLECTION (Optional – if not embedded)

Purpose: Stores normalized order items if system grows.

Fields:
- _id (UUID)
- orderId (UUID, ref: Orders, indexed)
- productId (UUID)
- quantity (Number)
- unitPrice (Number)
- subtotal (Number)
- createdAt (Date)

Index:
- Index on orderId

---

# 7. PAYMENTS COLLECTION

Purpose: Tracks all financial transactions.

Fields:
- _id (UUID)
- orderId (UUID, ref: Orders, indexed)
- transactionId (String, unique)
- paymentGateway (String)
- amount (Number)
- status (String, enum: ['INITIATED','SUCCESS','FAILED','REFUNDED'], indexed)
- gatewayResponse (Mixed JSON)
- processedAt (Date)
- createdAt (Date)

Index:
- Unique index on transactionId

---

# 8. REVIEWS COLLECTION

Purpose: Stores consumer ratings for farmers.

Fields:
- _id (UUID)
- farmerId (UUID, ref: Farmers, indexed)
- consumerId (UUID, ref: Consumers)
- orderId (UUID)
- rating (Number, 1–5, indexed)
- comment (String)
- createdAt (Date)

Index:
- Compound index: farmerId + consumerId

---

# 9. SUBSCRIPTIONS COLLECTION

Purpose: Stores recurring delivery configurations.

Fields:
- _id (UUID)
- consumerId (UUID, indexed)
- farmerId (UUID, indexed)
- products (Array of Embedded Objects)
  - productId
  - quantity
- frequency (String, enum: ['weekly','monthly'])
- nextDeliveryDate (Date, indexed)
- status (String, enum: ['active','paused','cancelled'])
- createdAt (Date)
- updatedAt (Date)

---

# 10. NOTIFICATIONS COLLECTION

Purpose: Stores system notifications.

Fields:
- _id (UUID)
- userId (UUID, indexed)
- type (String, enum: ['ORDER','PAYMENT','SUBSCRIPTION','SYSTEM'])
- message (String)
- referenceId (UUID)
- isRead (Boolean, default: false)
- createdAt (Date, indexed)

---

# 11. DELIVERYZONES COLLECTION

Purpose: Defines allowed service areas.

Fields:
- _id (UUID)
- zoneName (String)
- areaPolygon (GEOGRAPHY(Point,4326) Polygon)
- isActive (Boolean)
- createdAt (Date)

Index:
- PostGIS spatial index on areaPolygon

---

# 12. WALLETRANSACTIONS COLLECTION

Purpose: Tracks consumer wallet operations.

Fields:
- _id (UUID)
- userId (UUID, indexed)
- type (String, enum: ['CREDIT','DEBIT'])
- amount (Number)
- referenceId (UUID)
- description (String)
- createdAt (Date)

---

# 13. AUDITLOGS COLLECTION

Purpose: Tracks admin actions.

Fields:
- _id (UUID)
- adminId (UUID)
- action (String)
- targetCollection (String)
- targetId (UUID)
- metadata (Mixed JSON)
- createdAt (Date, indexed)

---

# RELATIONSHIP OVERVIEW

Users (1) → Farmers (1)
Users (1) → Consumers (1)
Farmers (1) → Products (Many)
Consumers (1) → Orders (Many)
Farmers (1) → Orders (Many)
Orders (1) → Payments (1)
Farmers (1) → Reviews (Many)
Consumers (1) → Subscriptions (Many)
Users (1) → Notifications (Many)

---

# DATABASE OPTIMIZATION NOTES

- Use transactions for order + payment creation.
- Embed order items for faster reads unless analytics requires normalization.
- Use lean() queries in Mongoose for performance.
- Paginate all list queries.
- Store snapshot values (price, product name) inside orders.

---

END OF DOCUMENT

