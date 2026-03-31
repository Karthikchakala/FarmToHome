-- =====================================================
-- Farm to Table Database Schema
-- Complete Database Setup Script
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for location data
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR NOT NULL UNIQUE,
    passwordhash VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('farmer', 'consumer', 'admin')),
    isverified BOOLEAN DEFAULT false,
    isbanned BOOLEAN DEFAULT false,
    profileimageurl TEXT,
    lastloginat TIMESTAMP WITH TIME ZONE,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Farmers table
CREATE TABLE IF NOT EXISTS public.farmers (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    farmname VARCHAR,
    description TEXT,
    farmingtype VARCHAR CHECK (farmingtype IN ('organic', 'natural', 'mixed')),
    location GEOMETRY(POINT, 4326),
    deliveryradius INTEGER DEFAULT 5000,
    verificationstatus VARCHAR DEFAULT 'pending' CHECK (verificationstatus IN ('pending', 'approved', 'rejected')),
    ratingaverage NUMERIC DEFAULT 0.00,
    totalreviews INTEGER DEFAULT 0,
    totalsales NUMERIC DEFAULT 0.00,
    commissionrate NUMERIC DEFAULT 5.00,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    isapproved BOOLEAN NOT NULL DEFAULT false,
    farmerid UUID NOT NULL DEFAULT gen_random_uuid()
);

-- Consumers table
CREATE TABLE IF NOT EXISTS public.consumers (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    defaultaddressstreet TEXT,
    defaultaddresscity VARCHAR,
    defaultaddressstate VARCHAR,
    defaultaddresspostalcode VARCHAR,
    defaultaddresslocation GEOMETRY(POINT, 4326),
    walletbalance NUMERIC DEFAULT 0.00,
    totalorders INTEGER DEFAULT 0,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consumerid UUID NOT NULL DEFAULT gen_random_uuid()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmerid UUID NOT NULL REFERENCES public.farmers(_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,
    unit VARCHAR CHECK (unit IN ('kg', 'gram', 'litre', 'piece')),
    priceperunit NUMERIC NOT NULL,
    stockquantity NUMERIC NOT NULL,
    minorderquantity NUMERIC DEFAULT 1,
    images TEXT[],
    isavailable BOOLEAN DEFAULT true,
    harvestdate DATE,
    expirydate DATE,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ratingaverage NUMERIC NOT NULL DEFAULT 0.00,
    ratingcount INTEGER NOT NULL DEFAULT 0,
    isfeatured BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT unique_farmer_product UNIQUE (farmerid, name)
);

-- Cart table
CREATE TABLE IF NOT EXISTS public.cart (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    productid UUID NOT NULL REFERENCES public.products(_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userid, productid)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordernumber VARCHAR NOT NULL UNIQUE,
    consumerid UUID NOT NULL REFERENCES public.consumers(_id),
    farmerid UUID NOT NULL REFERENCES public.farmers(_id),
    items JSONB NOT NULL,
    totalamount NUMERIC NOT NULL,
    platformcommission NUMERIC NOT NULL,
    deliverycharge NUMERIC DEFAULT 0.00,
    finalamount NUMERIC NOT NULL,
    deliveryaddressstreet TEXT NOT NULL,
    deliveryaddresscity VARCHAR NOT NULL,
    deliveryaddressstate VARCHAR NOT NULL,
    deliveryaddresspostalcode VARCHAR NOT NULL,
    deliveryaddresslocation GEOMETRY(POINT, 4326),
    status VARCHAR DEFAULT 'PLACED' CHECK (status IN ('PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED', 'DISPUTED')),
    paymentstatus VARCHAR DEFAULT 'PENDING' CHECK (paymentstatus IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    paymentmethod VARCHAR CHECK (paymentmethod IN ('COD', 'ONLINE', 'WALLET')),
    ordertype VARCHAR DEFAULT 'one-time' CHECK (ordertype IN ('one-time', 'subscription')),
    deliveredat TIMESTAMP WITH TIME ZONE,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orderid UUID NOT NULL REFERENCES public.orders(_id),
    transactionid VARCHAR UNIQUE,
    paymentgateway VARCHAR,
    amount NUMERIC NOT NULL,
    status VARCHAR DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED')),
    gatewayresponse JSONB,
    processedat TIMESTAMP WITH TIME ZONE,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmerid UUID NOT NULL REFERENCES public.farmers(_id),
    customerid UUID NOT NULL REFERENCES public.consumers(_id),
    orderid UUID NOT NULL REFERENCES public.orders(_id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_order_review UNIQUE (orderid)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumerid UUID NOT NULL REFERENCES public.consumers(_id),
    farmerid UUID NOT NULL REFERENCES public.farmers(_id),
    products JSONB NOT NULL,
    frequency VARCHAR NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
    nextdeliverydate DATE NOT NULL,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(_id),
    receiver_id UUID NOT NULL REFERENCES public.users(_id),
    order_id UUID REFERENCES public.orders(_id),
    message TEXT NOT NULL,
    message_type VARCHAR DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delivery zones table
CREATE TABLE IF NOT EXISTS public.deliveryzones (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zonename VARCHAR NOT NULL,
    areapolygon GEOMETRY(POLYGON, 4326),
    isactive BOOLEAN DEFAULT true,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallettransactions (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES public.users(_id),
    type VARCHAR NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    amount NUMERIC NOT NULL,
    referenceid UUID,
    description TEXT,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.auditlogs (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adminid UUID NOT NULL REFERENCES public.users(_id),
    action VARCHAR NOT NULL,
    targetcollection VARCHAR,
    targetid UUID,
    metadata JSONB,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FEEDBACK AND NOTIFICATIONS TABLES
-- =====================================================

-- Feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID REFERENCES public.users(_id) ON DELETE CASCADE,
    orderid UUID REFERENCES public.orders(_id) ON DELETE CASCADE,
    farmerid UUID REFERENCES public.farmers(_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    category VARCHAR DEFAULT 'general',
    feedbacktype VARCHAR NOT NULL CHECK (feedbacktype IN ('customer', 'farmer')),
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_order_feedback UNIQUE (orderid, userid)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID REFERENCES public.users(_id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN (
        'low_stock', 'order_confirmation', 'farmer_approval', 
        'order_update', 'product_approved', 'product_rejected',
        'new_order', 'order_cancelled', 'payment_received',
        'subscription_created', 'subscription_cancelled',
        'review_received', 'system_update'
    )),
    priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    isread BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    actionurl VARCHAR,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    readat TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(createdat);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- Farmers table indexes
CREATE INDEX IF NOT EXISTS idx_farmers_userid ON farmers(userid);
CREATE INDEX IF NOT EXISTS idx_farmers_isapproved ON farmers(isapproved);
CREATE INDEX IF NOT EXISTS idx_farmers_created_at ON farmers(createdat);
CREATE INDEX IF NOT EXISTS idx_farmers_farmname ON farmers(farmname);
CREATE INDEX IF NOT EXISTS idx_farmers_location ON farmers USING GIST (location);

-- Consumers table indexes
CREATE INDEX IF NOT EXISTS idx_consumers_userid ON consumers(userid);
CREATE INDEX IF NOT EXISTS idx_consumers_created_at ON consumers(createdat);
CREATE INDEX IF NOT EXISTS idx_consumers_location ON consumers USING GIST (defaultaddresslocation);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_farmerid ON products(farmerid);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_isavailable ON products(isavailable);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(createdat);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(priceperunit);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stockquantity);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Composite indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category_available ON products(category, isavailable);
CREATE INDEX IF NOT EXISTS idx_products_farmer_available ON products(farmerid, isavailable);
CREATE INDEX IF NOT EXISTS idx_products_price_available ON products(priceperunit, isavailable);

-- Cart table indexes
CREATE INDEX IF NOT EXISTS idx_cart_userid ON cart(userid);
CREATE INDEX IF NOT EXISTS idx_cart_productid ON cart(productid);
CREATE INDEX IF NOT EXISTS idx_cart_created_at ON cart(createdat);
CREATE INDEX IF NOT EXISTS idx_cart_user_product ON cart(userid, productid);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_consumerid ON orders(consumerid);
CREATE INDEX IF NOT EXISTS idx_orders_farmerid ON orders(farmerid);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(createdat);
CREATE INDEX IF NOT EXISTS idx_orders_totalamount ON orders(totalamount);
CREATE INDEX IF NOT EXISTS idx_orders_paymentmethod ON orders(paymentmethod);

-- Composite indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_consumer_status ON orders(consumerid, status);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_status ON orders(farmerid, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, createdat);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_farmerid ON reviews(farmerid);
CREATE INDEX IF NOT EXISTS idx_reviews_customerid ON reviews(customerid);
CREATE INDEX IF NOT EXISTS idx_reviews_orderid ON reviews(orderid);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(createdat);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_consumerid ON subscriptions(consumerid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_farmerid ON subscriptions(farmerid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_frequency ON subscriptions(frequency);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(createdat);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_delivery ON subscriptions(nextdeliverydate, status);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(createdat);
CREATE INDEX IF NOT EXISTS idx_messages_isread ON messages(isread);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(orderid);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, isread);

-- Feedbacks table indexes
CREATE INDEX IF NOT EXISTS idx_feedbacks_userid ON feedbacks(userid);
CREATE INDEX IF NOT EXISTS idx_feedbacks_orderid ON feedbacks(orderid);
CREATE INDEX IF NOT EXISTS idx_feedbacks_farmerid ON feedbacks(farmerid);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_feedbacktype ON feedbacks(feedbacktype);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(createdat);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_userid ON notifications(userid);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_isread ON notifications(isread);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(createdat);
CREATE INDEX IF NOT EXISTS idx_notifications_userid_unread ON notifications(userid, isread);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallettransactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = _id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = _id::text);

-- Farmers RLS policies
CREATE POLICY "Users can view their own farmer profile" ON farmers
    FOR SELECT USING (auth.uid()::text = userid::text);

CREATE POLICY "Users can update their own farmer profile" ON farmers
    FOR UPDATE USING (auth.uid()::text = userid::text);

CREATE POLICY "Anyone can view approved farmers" ON farmers
    FOR SELECT USING (isapproved = true);

-- Consumers RLS policies
CREATE POLICY "Users can view their own consumer profile" ON consumers
    FOR SELECT USING (auth.uid()::text = userid::text);

CREATE POLICY "Users can update their own consumer profile" ON consumers
    FOR UPDATE USING (auth.uid()::text = userid::text);

-- Cart RLS policies
CREATE POLICY "Users can only see their own cart items" ON cart
    FOR SELECT USING (auth.uid()::text = userid::text);

CREATE POLICY "Users can only insert their own cart items" ON cart
    FOR INSERT WITH CHECK (auth.uid()::text = userid::text);

CREATE POLICY "Users can only update their own cart items" ON cart
    FOR UPDATE USING (auth.uid()::text = userid::text);

CREATE POLICY "Users can only delete their own cart items" ON cart
    FOR DELETE USING (auth.uid()::text = userid::text);

-- Orders RLS policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (
        auth.uid()::text = consumerid::text OR 
        auth.uid()::text IN (SELECT userid::text FROM farmers WHERE _id::text = farmerid::text)
    );

-- Reviews RLS policies
CREATE POLICY "Users can view reviews for their orders" ON reviews
    FOR SELECT USING (auth.uid()::text = customerid::text);

CREATE POLICY "Farmers can view reviews for their products" ON reviews
    FOR SELECT USING (auth.uid()::text IN (SELECT userid::text FROM farmers WHERE _id::text = farmerid::text));

-- Messages RLS policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid()::text = sender_id::text);

-- Feedbacks RLS policies
CREATE POLICY "Users can view their own feedbacks" ON feedbacks
    FOR SELECT USING (auth.uid()::text = userid::text);

CREATE POLICY "Users can insert their own feedbacks" ON feedbacks
    FOR INSERT WITH CHECK (auth.uid()::text = userid::text);

CREATE POLICY "Users can update their own feedbacks" ON feedbacks
    FOR UPDATE USING (auth.uid()::text = userid::text);

-- Notifications RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = userid::text);

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid()::text = userid::text);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = userid::text);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid()::text = userid::text);

-- Admin policies for all tables
CREATE POLICY "Admins can manage all data" ON users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE _id::text = auth.uid()::text AND role = 'admin')
    );

CREATE POLICY "Admins can manage all farmers" ON farmers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE _id::text = auth.uid()::text AND role = 'admin')
    );

CREATE POLICY "Admins can manage all consumers" ON consumers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE _id::text = auth.uid()::text AND role = 'admin')
    );

CREATE POLICY "Admins can manage all orders" ON orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE _id::text = auth.uid()::text AND role = 'admin')
    );

CREATE POLICY "Admins can manage all feedbacks" ON feedbacks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE _id::text = auth.uid()::text AND role = 'admin')
    );

CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE _id::text = auth.uid()::text AND role = 'admin')
    );

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to automatically update updatedat columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updatedat
CREATE TRIGGER update_users_updatedat BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farmers_updatedat BEFORE UPDATE ON farmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consumers_updatedat BEFORE UPDATE ON consumers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updatedat BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_updatedat BEFORE UPDATE ON cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updatedat BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updatedat BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updatedat BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedbacks_updatedat BEFORE UPDATE ON feedbacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notification functions
CREATE OR REPLACE FUNCTION create_notification(
    p_userid UUID,
    p_title VARCHAR,
    p_message TEXT,
    p_type VARCHAR,
    p_priority VARCHAR DEFAULT 'medium',
    p_data JSONB DEFAULT '{}',
    p_actionurl VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        userid, title, message, type, priority, data, actionurl
    ) VALUES (
        p_userid, p_title, p_message, p_type, p_priority, p_data, p_actionurl
    ) RETURNING _id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET isread = TRUE, readat = CURRENT_TIMESTAMP
    WHERE _id = p_notification_id AND userid = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_all_notifications_read(
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET isread = TRUE, readat = CURRENT_TIMESTAMP
    WHERE userid = p_user_id AND isread = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update product rating when review is added
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET 
        ratingaverage = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM reviews 
            WHERE farmerid = NEW.farmerid
        ),
        ratingcount = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE farmerid = NEW.farmerid
        )
    WHERE _id IN (
        SELECT _id FROM farmers WHERE userid = NEW.farmerid
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_trigger 
    AFTER INSERT OR UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- =====================================================
-- VIEWS FOR MONITORING
-- =====================================================

-- Performance monitoring view
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

-- Index usage monitoring view
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

-- Table size monitoring view
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- =====================================================
-- COMPLETION
-- =====================================================

-- Database schema setup completed successfully!
-- Tables: users, farmers, consumers, products, cart, orders, payments, reviews, subscriptions, messages, feedbacks, notifications, deliveryzones, wallettransactions, auditlogs
-- Indexes: Created for optimal performance
-- RLS: Enabled with comprehensive security policies
-- Functions: Notification management and rating updates
-- Triggers: Automatic timestamp updates
-- Views: Performance monitoring
