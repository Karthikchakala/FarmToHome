-- Performance Indexes for Farm to Table Database
-- These indexes will significantly improve query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- Farmers table indexes
CREATE INDEX IF NOT EXISTS idx_farmers_userid ON farmers(userid);
CREATE INDEX IF NOT EXISTS idx_farmers_isapproved ON farmers(isapproved);
CREATE INDEX IF NOT EXISTS idx_farmers_created_at ON farmers(created_at);
CREATE INDEX IF NOT EXISTS idx_farmers_farmname ON farmers(farmname);

-- Consumers table indexes
CREATE INDEX IF NOT EXISTS idx_consumers_userid ON consumers(userid);
CREATE INDEX IF NOT EXISTS idx_consumers_created_at ON consumers(created_at);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_farmerid ON products(farmerid);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_isavailable ON products(isavailable);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(priceperunit);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stockquantity);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_available ON products(category, isavailable);
CREATE INDEX IF NOT EXISTS idx_products_farmer_available ON products(farmerid, isavailable);
CREATE INDEX IF NOT EXISTS idx_products_price_available ON products(priceperunit, isavailable);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_userid ON orders(userid);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_totalamount ON orders(totalamount);
CREATE INDEX IF NOT EXISTS idx_orders_paymentmethod ON orders(paymentmethod);

-- Composite indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(userid, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, created_at);

-- Cart table indexes
CREATE INDEX IF NOT EXISTS idx_cart_userid ON cart(userid);
CREATE INDEX IF NOT EXISTS idx_cart_productid ON cart(productid);
CREATE INDEX IF NOT EXISTS idx_cart_created_at ON cart(created_at);

-- Composite index for cart
CREATE INDEX IF NOT EXISTS idx_cart_user_product ON cart(userid, productid);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_productid ON reviews(productid);
CREATE INDEX IF NOT EXISTS idx_reviews_userid ON reviews(userid);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Composite indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(productid, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_product_date ON reviews(productid, createdat);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_consumerid ON subscriptions(consumerid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_productid ON subscriptions(productid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_frequency ON subscriptions(frequency);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(createdat);

-- Composite indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_consumer_status ON subscriptions(consumerid, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_delivery ON subscriptions(nextdeliverydate, status);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_userid ON notifications(userid);
CREATE INDEX IF NOT EXISTS idx_notifications_isread ON notifications(isread);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(createdat);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Composite indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(userid, isread);
CREATE INDEX IF NOT EXISTS idx_notifications_priority_read ON notifications(priority, isread);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(createdat);
CREATE INDEX IF NOT EXISTS idx_messages_isread ON messages(isread);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(orderid);

-- Composite indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, isread);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(
  CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
  CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END,
  createdat
);

-- Audit logs table indexes
CREATE INDEX IF NOT EXISTS idx_auditlogs_userid ON auditlogs(userid);
CREATE INDEX IF NOT EXISTS idx_auditlogs_action ON auditlogs(action);
CREATE INDEX IF NOT EXISTS idx_auditlogs_table_name ON auditlogs(tablename);
CREATE INDEX IF NOT EXISTS idx_auditlogs_created_at ON auditlogs(createdat);

-- Composite indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_auditlogs_user_action ON auditlogs(userid, action);
CREATE INDEX IF NOT EXISTS idx_auditlogs_table_action ON auditlogs(tablename, action);

-- Wallet transactions table indexes
CREATE INDEX IF NOT EXISTS idx_wallettransactions_userid ON wallettransactions(userid);
CREATE INDEX IF NOT EXISTS idx_wallettransactions_type ON wallettransactions(transactiontype);
CREATE INDEX IF NOT EXISTS idx_wallettransactions_created_at ON wallettransactions(createdat);

-- Composite indexes for wallet transactions
CREATE INDEX IF NOT EXISTS idx_wallettransactions_user_type ON wallettransactions(userid, transactiontype);
CREATE INDEX IF NOT EXISTS idx_wallettransactions_type_date ON wallettransactions(transactiontype, createdat);

-- Delivery zones table indexes
CREATE INDEX IF NOT EXISTS idx_deliveryzones_areacode ON deliveryzones(areacode);
CREATE INDEX IF NOT EXISTS idx_deliveryzones_created_at ON deliveryzones(createdat);

-- Performance monitoring queries
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
  schemaname,
  tablename,
  attname as column_name,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Index usage monitoring
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table size monitoring
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Slow query monitoring (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- CREATE OR REPLACE VIEW slow_queries AS
-- SELECT 
--   query,
--   calls,
--   total_time,
--   mean_time,
--   rows
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;
