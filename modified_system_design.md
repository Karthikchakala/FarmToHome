# SYSTEM DESIGN DOCUMENT
## Farm to Table – Hyperlocal Agri-Commerce Platform (React + Node.js + PostgreSQL Architecture)

---

# 1. High-Level Architecture

Farm to Table follows a client-server distributed architecture built using the MERN stack.

Architecture Layers:

1. Client Layer (Frontend)
   - React.js web application
   - Communicates via REST APIs
   - Handles UI rendering, state management, and API calls

2. Application Layer (Backend)
   - Node.js + Express.js
   - Business logic
   - Authentication & authorization
   - Order processing
   - Payment integration
   - Subscription automation

3. Data Layer
   - PostgreSQL (Supabase)
   - GeoSpatial indexing for location-based queries

4. External Services
   - Payment Gateway (Razorpay/Stripe)
   - Email Service (Nodemailer)
   - Email Service
   - 

The backend is stateless to enable horizontal scaling behind a load balancer.

---

# 2. System Components & Responsibilities

## Frontend (React)
- User authentication flow
- Farmer dashboard
- Consumer dashboard
- Admin dashboard
- Cart management
- Subscription UI
- Review and rating interface

## API Server (Node + Express)
- REST API routing
- Request validation
- Authentication middleware
- Geo queries
- Order lifecycle state machine
- Payment verification
- Commission calculation
- Notification triggering

## Database (PostgreSQL)
- Stores users, farmers, products, orders, payments, subscriptions
- Supports GeoSpatial queries

## Background Services
- Subscription scheduler (Node Cron)
- Notification queue processor
- Payment webhook listener

---

# 3. API Design (REST Structure)

Base URL: /api

Auth:
POST /auth/register
POST /auth/login
GET  /auth/profile

Farmer:
POST   /farmer/products
GET    /farmer/products
PUT    /farmer/products/:id
DELETE /farmer/products/:id
GET    /farmer/orders
PUT    /farmer/orders/:id/status

Consumer:
GET    /products?lat=&lng=
POST   /cart/add
POST   /orders
GET    /orders
POST   /subscriptions

Admin:
GET    /admin/farmers/pending
PUT    /admin/farmers/:id/approve
GET    /admin/analytics/dashboard

Payments:
POST   /payments/create-order
POST   /payments/verify

All endpoints are protected using role-based middleware where applicable.

---

# 4. Authentication & Authorization (JWT-Based)

Authentication Flow:

1. User logs in.
2. Server validates credentials.
3. Access token (JWT) issued (15–30 min validity).
4. Refresh token stored securely.

Authorization:
- Role-based middleware
- Roles: farmer, consumer, admin
- Route-level access control

Security Measures:
- bcrypt hashing
- JWT signature verification
- HTTP-only cookies (if used)

---

# 5. Geo-Location Filtering Implementation

Farmer Schema includes PostGIS structure:

location: {
  type: "Point",
  coordinates: [longitude, latitude]
}

Index:
location: PostGIS spatial

Query for 7 km radius:

$near with $geometry
$maxDistance: 7000 (meters)

Geo filtering occurs in product listing pipeline by matching farmer location.

---

# 6. Database Design (PostgreSQL Collections)

Users
- role
- verification status

Farmers
- userId reference
- location (PostGIS)
- deliveryRadius
- ratingAverage

Products
- farmerId reference
- price
- stockQuantity

Orders
- consumerId
- farmerId
- items array
- status
- commissionAmount

Reviews
- farmerId
- consumerId
- rating

Subscriptions
- consumerId
- frequency
- nextDeliveryDate

Payments
- orderId
- transactionId
- status

Notifications
- userId
- message
- isRead

Relationships handled via ObjectId references.

---

# 7. Order Lifecycle & State Management

States:
PLACED → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED

Edge States:
CANCELLED
FAILED
DISPUTED

State transitions validated server-side.

Commission Calculation:
Commission = totalAmount × platformPercentage
Stored per order.

---

# 8. Inventory Concurrency Handling

Approach:
- Use conditional update with $gte
- PostgreSQL transactions for order creation

Stock update example logic:
Only decrease stock if available stock ≥ requested quantity.

Prevents overselling in high-traffic scenarios.

---

# 9. Caching Strategy

Redis used for:
- Caching product listings
- Frequently accessed farmer profiles
- Rate limiting

Cache invalidation occurs on:
- Product update
- Stock change
- Price modification

TTL-based expiration implemented.

---

# 10. Scalability Strategy

Horizontal Scaling:
- Stateless Express servers
- Load balancer
- Auto-scaling containers

Database Scaling:
- PostgreSQL Replica Set
- Future sharding for large datasets

Asynchronous Processing:
- Background jobs for subscriptions and notifications

---

# 11. Security Architecture

- HTTPS enforced
- Helmet security headers
- Rate limiting middleware
- Input validation using schema validation
- PostgreSQL injection protection
- Role-based access control
- Webhook signature validation for payments

Sensitive fields encrypted where necessary.

---

# 12. Logging & Monitoring

Logging:
- Winston logger
- Request logs
- Error logs
- Audit logs for admin actions

Monitoring:
- API latency tracking
- Error rate metrics
- Payment failure monitoring
- Server health checks

Integrations possible with:
- CloudWatch / Datadog

---

# 13. Deployment Architecture

Dockerized Services:
- Frontend container
- Backend container

Cloud Deployment:
- AWS EC2 or container service
- Nginx reverse proxy
- PostgreSQL Atlas

CI/CD:
- GitHub Actions
- Automated build & deployment pipeline

Environment-based configuration (.env separation).

---

# 14. Failure & Recovery Strategy

Payment Failure:
- Mark order as FAILED
- Trigger notification

Stock Failure:
- Transaction rollback

Service Crash:
- Container auto-restart

Database Failure:
- Replica set failover

Webhook Failure:
- Idempotency key mechanism

---

# 15. Data Flow Diagrams (Text-Based)

## Order Placement Flow
1. Consumer adds product to cart.
2. Consumer places order.
3. Backend validates stock.
4. Transaction reduces stock.
5. Order created.
6. Payment initiated.
7. Payment verified.
8. Notification sent to farmer.

## Geo Product Discovery
1. Consumer sends lat/lng.
2. Backend performs GeoSpatial query.
3. Products returned within 7 km.
4. Results cached.

## Subscription Execution
1. Cron job runs daily.
2. Checks nextDeliveryDate.
3. Auto-creates order.
4. Sends notification.

---

# Conclusion

Farm to Table is designed as a production-ready hyperlocal agri-commerce system using a scalable MERN architecture. The system supports geo-based discovery, subscription automation, commission tracking, secure transactions, and horizontal scalability. With proper deployment and monitoring, it is capable of handling startup-level growth and scaling toward enterprise readiness.

---

END OF DOCUMENT

