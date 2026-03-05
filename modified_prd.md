# Product Requirements Document (PRD)
## Farm to Table – Direct Farmer to Consumer Marketplace

---

## 1. Product Overview

**Product Name:** Farm to Table  
**Category:** E-Commerce / AgriTech  
**Target Users:** Farmers, Consumers, Administrators  

Farm to Table is a location-based e-commerce platform that enables farmers to sell agricultural products directly to consumers within a local radius (5–7 km), eliminating intermediaries and ensuring fair pricing and fresh produce.

---

## 2. Goals & Objectives

- Enable direct farmer-to-consumer sales
- Ensure local-only product visibility
- Provide transparency in pricing and stock
- Simplify digital adoption for farmers
- Enable administrative monitoring and auditing
- Establish a sustainable revenue model
- Build a trusted hyperlocal agri-commerce ecosystem

---

## 3. Success Metrics (KPIs)

- Farmer onboarding completion rate
- Active farmers per week
- Total orders per day
- Order fulfillment rate
- Average delivery distance
- Cart abandonment rate
- Platform uptime (%)
- Average API response time (<300 ms)
- Revenue per active farmer
- Subscription conversion rate

---

## 4. User Personas

### 4.1 Farmer Persona
- Small-scale farmer (2–5 acres)
- Limited technical literacy
- Needs fast product upload & simple UI

### 4.2 Consumer Persona
- Urban or semi-urban resident
- Quality and price conscious
- Wants fresh, traceable produce

### 4.3 Admin Persona
- Platform operator
- Responsible for verification & monitoring
- Needs dashboards and alerts

---

## 5. User Roles & Permissions

| Role | Permissions |
|----|----|
| Farmer | Product management, order handling, delivery configuration |
| Consumer | Browse, order, payment, subscription management |
| Admin | Full system access, monitoring, dispute management |

---

## 6. Delivery & Logistics Model

Delivery options supported:
- Farmer-managed delivery
- Self-pickup option
- Hybrid model (future: platform delivery partners)

Delivery workflow must support:
- Delivery slot selection
- Delivery tracking (future enhancement)
- Distance-based validation

---

## 7. Payment & Revenue Model

### Payment Options
- Cash on Delivery (COD)
- Prepaid via payment gateway
- Future: Wallet & escrow system

### Revenue Streams
| Source | Description |
|--------|------------|
| Commission | 5–10% per transaction |
| Premium Farmer Plan | Monthly subscription (e.g., ₹299/month) |
| Sponsored Listings | Paid product promotion |
| Delivery Charges | Shared margin |

Escrow model (future): Payment released to farmer after successful delivery confirmation.

---

## 8. Order Lifecycle Definition

Order status flow:
Placed → Confirmed → Packed → Out for Delivery → Delivered → Completed

Edge statuses:
Cancelled → Failed → Disputed

---

## 9. Inventory & Stock Management

- Real-time stock validation
- Atomic stock updates using DB transactions
- Row-level locking to prevent overselling
- Temporary stock reservation (5-minute soft lock during checkout)
- Low stock alerts to farmers

---

## 10. Location & Geo-Based Filtering

- Store latitude & longitude for farmers
- Use PostGIS or Haversine formula for distance calculation
- GeoSpatial indexing for efficient queries
- Delivery radius validation (5–7 km configurable)

---

## 11. Notification System

- Order confirmation notifications (SMS/Push)
- Order status updates
- Low stock alerts
- Admin fraud or dispute alerts

---

## 12. Privacy & Compliance

- Role-based access control (RBAC)
- Password hashing (bcrypt)
- Secure API routes
- Personal data retention policy
- Phone number masking between farmer and consumer
- Basic GDPR-like privacy principles

---

## 13. Analytics & Monitoring

### Analytics
- Top-selling products
- Most active farmers
- Revenue per farmer
- Peak ordering hours

### Monitoring
- API error rates
- Failed transactions
- Server health metrics
- Suspicious activity logs

---

## 14. High Impact Product Ideas

### Community Trust System
- Verified farmer badge
- Farm images & details
- Growing method display (Organic/Natural)
- Ratings & reviews

### Subscription Model
- Weekly vegetable box
- Monthly fruit basket
- Recurring milk delivery
- Auto-renewal billing support

---

## 15. Feature Prioritization

### MVP
- User authentication
- Farmer product listing
- Location filtering
- Order placement
- Order lifecycle management
- Basic revenue tracking

### Phase 2
- Online payments
- Ratings & reviews
- Subscription system
- Advanced analytics dashboard

### Phase 3
- AI demand insights
- Wallet & escrow system
- Dedicated mobile application

---

## 16. Technical Architecture Improvements

- RESTful APIs
- JWT-based authentication
- MVC architecture
-  caching
- GeoSpatial indexing (PostGIS)
- Rate limiting middleware
- Centralized logging system
- Docker-based deployment
- Asynchronous processing for notifications

---

## 17. Database Schema (Enhanced)

Core Tables:
- Users
- Farmers
- Consumers
- Products
- Orders
- OrderItems
- Payments
- Reviews
- Subscriptions
- Notifications
- DeliveryZones
- WalletTransactions
- AuditLogs

---

## 18. Competitive Analysis

| Platform | Limitation | Our Advantage |
|----------|------------|--------------|
| BigBasket | Central warehouse model | Hyperlocal direct sourcing |
| Local Mandis | Offline only | Digital convenience |
| Amazon Fresh | Middlemen pricing | Farmer-controlled pricing |

Differentiator: Direct farmer pricing + hyperlocal delivery.

---

## 19. Expanded Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Farmer fraud | KYC verification & admin approval |
| Quality complaints | Rating & review system |
| Order disputes | Escrow system |
| Weather dependency | Dynamic availability updates |
| Scaling issues | Database indexing & caching |

---

## 20. Testing Strategy

- Unit testing
- Integration testing
- Role-based access testing
- Load testing
- Geo-based query testing
- Payment flow testing

---

## 21. Revised Timeline (Realistic)

Sprint 1–2 (Weeks 1–2): Requirements finalization & system design  
Sprint 3–4 (Weeks 3–4): Backend development (Auth, Orders, Geo)  
Sprint 5 (Week 5): Frontend integration  
Sprint 6 (Week 6): Payment integration & subscriptions  
Sprint 7 (Week 7): Testing & optimization  
Sprint 8 (Week 8): Deployment & pilot launch

Estimated MVP Completion: 6–8 weeks

---

## 22. Conclusion

Farm to Table is positioned as a scalable, revenue-generating hyperlocal agri-commerce platform combining transparent pricing, trust systems, and sustainable digital infrastructure. With enhanced logistics definition, revenue model clarity, secure architecture, and subscription mechanisms, the platform is now structured as a startup-ready product with strong technical and business foundations.

---

End of Document



## User Interface Requirements

### Homepage
The platform must include a modern ecommerce-style landing page inspired by leading ecommerce platforms.

Sections:
- Hero banner with farm imagery
- Quote: "Fresh From Farm To Your Table"
- Featured products grid
- Why Choose Us section
- Farmer stories
- Customer testimonials
- Farming quotes section
- Call-to-action buttons
- Footer with policies and contact links

### Navigation
Use a **vertical sidebar navigation** instead of a horizontal navbar.

Menu:
Home
Products
Orders
Subscriptions
Farmers
Login / Register

### Mobile Support (Strict)
All pages must follow mobile‑first responsive design.

Requirements:
- Responsive layouts
- Flexible grids
- Responsive images
- Sidebar collapses to hamburger menu
- No horizontal overflow
