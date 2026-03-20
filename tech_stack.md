# DETAILED TECH STACK DOCUMENT
## Farm to Table – Hyperlocal Agri-Commerce Platform (Node.js + PostgreSQL / Supabase)

---

# 1. Overview

Farm to Table is a hyperlocal agri-commerce platform built using Node.js, Express.js, React.js, and PostgreSQL (Supabase). The system is designed to support geo-based discovery, real-time inventory management, subscription automation, commission tracking, and secure payments.

This document defines the complete production-level technology stack including frontend, backend, database architecture, DevOps, integrations, and scalability considerations.

---

# 2. Frontend Technology Stack

## Core Framework
- React.js (Functional Components + Hooks)
- Vite (preferred build tool for faster development)
- React Router DOM (client-side routing)

## State Management
- Redux Toolkit (global state management)
- RTK Query (API state + caching)

## UI & Styling
- CSS (styling)
- Material UI (Admin dashboard components)

## Forms & Validation
- React Hook Form
- Zod (schema validation)

## Communication
- Axios (HTTP client)
- WebSocket (optional future real-time updates)

## Frontend Architecture Pattern
- Feature-based folder structure
- Reusable component library
- Role-based layout system (farmer, consumer, admin)

---

# 3. Backend Technology Stack

## Core Runtime
- Node.js (LTS version)
- Express.js (REST API framework)

## Architecture Pattern
- MVC Pattern
- Service Layer abstraction
- Repository pattern (optional advanced scaling)

## Authentication & Security
- JWT (Access + Refresh tokens)
- bcrypt (password hashing)
- Helmet (HTTP security headers)
- Express Rate Limit
- CORS configuration
- JOI or Zod for request validation

## Background Jobs
- Node-Cron (subscription processing)
- BullMQ (optional queue processing with )

## Logging
- Winston logger
- Morgan (HTTP request logging)

## API Documentation
- Swagger (OpenAPI specification)

---

# 4. Database Stack (PostgreSQL / Supabase)

## Database Service
- Supabase PostgreSQL (managed cloud database)
- ACID-compliant relational database
- Automated backups enabled
- Built-in authentication and API support

## ORM / Query Layer
- Prisma ORM (recommended)
- Sequelize (alternative)
- Knex.js (query builder option)

## Indexing Strategy
- Unique indexes: email, phone
- PostGIS spatial index: farmer.location
- Compound index: products(farmer_id, is_available)
- Index: orders(status, farmer_id)

## Core Tables

1. users
2. farmers
3. products
4. orders
5. reviews
6. subscriptions
7. payments
8. cart
9. notifications
10. audit_logs

## Data Relationships
- users → role-based distinction
- farmers → linked to users via user_id
- products → linked to farmers
- orders → linked to consumer + farmer
- reviews → linked to consumer + farmer
- payments → linked to orders

Relationships maintained using SQL foreign keys.

---

# 5. Geo-Location Technology

## Implementation
- PostGIS extension in PostgreSQL
- Geography / Geometry spatial types
- Spatial indexing for fast location queries

## Distance Calculation
Use PostGIS function:

ST_DWithin()

Example:
Find farmers within 7 km of consumer location.

## Performance Considerations
- Pre-filter active farmers
- Use indexed spatial queries
- Limit query projection

---

# 6. Payment Integration Stack

## Supported Methods
- Cash on Delivery
- Razorpay / Stripe (Online Payment)

## Payment Flow
1. Backend creates payment order.
2. Frontend triggers payment gateway.
3. Payment success triggers webhook.
4. Backend verifies signature.
5. Order marked PAID.

## Security
- Webhook signature verification
- Idempotency keys to avoid duplicate transactions

---

# 7. Subscription Automation Stack

## Scheduler
- Node-Cron job (runs daily)

## Process
- Check active subscriptions
- Validate stock
- Auto-create order
- Notify farmer & consumer

## Optimization
- Use queue system if subscription volume increases

---

# 8. Notification System Stack

## Channels
- SMS (Email notifications via Nodemailer)
- Email (Nodemailer)
- Push (Firebase – optional)

## Trigger Points
- Order placed
- Order status updated
- Payment failure
- Subscription generated
- Low stock alert

## Async Handling
- Processed via background job queue

---

# 9. Caching Strategy

##  (Optional but Recommended)

Use Cases:
- Cache product discovery results
- Cache farmer profiles
- Rate limiting storage

Cache Invalidation:
- On product update
- On stock update
- On price modification

TTL Strategy:
- Product listing: 5–10 minutes

---

# 10. Scalability Strategy

## Application Scaling
- Stateless backend
- Horizontal scaling behind Load Balancer
- Docker containers

## Database Scaling
- PostgreSQL read replicas
- Vertical scaling initially
- Partitioning for large tables

## Async Processing
- Offload heavy operations to background jobs

---

# 11. DevOps & Deployment Stack

## Containerization
- Docker (Backend)
- Docker Compose (Local development)

## Cloud Infrastructure Options

Option 1 (Startup Budget):
- Frontend: Vercel
- Backend: Render
- DB: Supabase PostgreSQL

Option 2 (Scalable Production):
- AWS EC2 / ECS
- Nginx reverse proxy
- Supabase PostgreSQL
-  (AWS ElastiCache)

## CI/CD
- GitHub Actions
- Automated testing before deployment

---

# 12. Security Architecture

## API Level Security
- JWT authentication
- Role-based access middleware
- Rate limiting
- Input sanitization

## Data Security
- Password hashing (bcrypt)
- Encrypted environment variables
- HTTPS enforced

## Payment Security
- Verified webhooks
- Transaction logging
- Fraud monitoring alerts

---

# 13. Monitoring & Observability

## Logging
- Winston structured logs
- Error stack tracking

## Monitoring Metrics
- API latency
- Error rate
- Payment failure rate
- Server CPU & memory

## Tools (Optional Advanced)
- Datadog
- AWS CloudWatch
- Sentry (error tracking)

---

# 14. Performance Optimization Strategy

- Use indexed SQL queries
- Select only required fields
- Paginate all list endpoints
- Use PostGIS spatial indexes
- Batch processing for notifications

---

# 15. Production Readiness Checklist

- Environment separation (dev/staging/prod)
- Secrets stored securely
- Automated database backups
- Logging enabled
- Health check endpoint
- Rate limiting enabled
- API documentation published

---

# Conclusion

The Farm to Table platform is built on a scalable Node.js + PostgreSQL architecture designed for hyperlocal commerce. The technology stack supports geo-based filtering, high concurrency order processing, subscription automation, secure online payments, and horizontal scalability. With proper DevOps implementation, it is production-ready and capable of handling startup-level growth toward enterprise scalability.

---

END OF DOCUMENT

## UI Requirements

- Plain CSS only (Tailwind and Bootstrap not allowed)
- Vertical sidebar navigation layout
- Dedicated ecommerce homepage
- Mobile‑first responsive design
