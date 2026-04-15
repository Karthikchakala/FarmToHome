-- ========================================
-- UPDATE EXISTING SCHEMA TO MATCH NEW DEALER/EXPERT STRUCTURE
-- Run these queries in Supabase SQL Editor
-- ========================================

-- 1. Update users table role constraint (if not already updated)
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (
  (role)::text = any (
    (
      array[
        'farmer'::character varying,
        'consumer'::character varying,
        'admin'::character varying,
        'dealer'::character varying,
        'expert'::character varying
      ]
    )::text[]
  )
);

-- 2. Update dealers table structure
-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Check and add columns one by one
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'businessname'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN businessname character varying(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'businesstype'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN businesstype character varying(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'licensenumber'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN licensenumber character varying(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'businessaddress'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN businessaddress text;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'businesscity'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN businesscity character varying(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'businessstate'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN businessstate character varying(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'businesspostalcode'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN businesspostalcode character varying(20);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'businessphone'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN businessphone character varying(20);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'businessemail'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN businessemail character varying(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN description text;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'minimumorderquantity'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN minimumorderquantity integer DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'servicedeliveryradius'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN servicedeliveryradius integer DEFAULT 50;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'preferredcrops'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN preferredcrops text[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'paymentterms'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN paymentterms character varying(100) DEFAULT 'COD';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'verificationdocuments'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN verificationdocuments text[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'totaltransactions'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN totaltransactions integer DEFAULT 0;
    END IF;
    
    -- Add proper constraints
    ALTER TABLE public.dealers ALTER COLUMN businessname SET NOT NULL;
    ALTER TABLE public.dealers ALTER COLUMN businesstype SET NOT NULL;
    ALTER TABLE public.dealers ALTER COLUMN licensenumber SET NOT NULL;
    ALTER TABLE public.dealers ALTER COLUMN businessaddress SET NOT NULL;
    ALTER TABLE public.dealers ALTER COLUMN businesscity SET NOT NULL;
    ALTER TABLE public.dealers ALTER COLUMN businessstate SET NOT NULL;
    ALTER TABLE public.dealers ALTER COLUMN businesspostalcode SET NOT NULL;
    ALTER TABLE public.dealers ALTER COLUMN businessphone SET NOT NULL;
    ALTER TABLE public.dealers ALTER COLUMN businessemail SET NOT NULL;
    
    -- Add unique constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'dealers' AND constraint_name = 'dealers_userid_key'
    ) THEN
        ALTER TABLE public.dealers ADD CONSTRAINT dealers_userid_key UNIQUE (userid);
    END IF;
    
    -- Ensure foreign key constraint has cascade delete
    ALTER TABLE public.dealers DROP CONSTRAINT IF EXISTS dealers_userid_fkey;
    ALTER TABLE public.dealers ADD CONSTRAINT dealers_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(_id) ON DELETE CASCADE;
    
END $$;

-- 3. Update experts table structure
DO $$
BEGIN
    -- Check and add columns one by one
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'specialization'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN specialization character varying(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'expertiselevel'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN expertiselevel character varying(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'qualifications'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN qualifications text[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'experienceyears'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN experienceyears integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'consultationfee'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN consultationfee numeric(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'availabilitystatus'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN availabilitystatus character varying(20) DEFAULT 'available';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'consultationhours'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN consultationhours text[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'languages'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN languages text[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'certificatedocuments'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN certificatedocuments text[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'verificationstatus'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN verificationstatus character varying(20) DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'experts' AND column_name = 'totalconsultations'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN totalconsultations integer DEFAULT 0;
    END IF;
    
    -- Add proper constraints
    ALTER TABLE public.experts ALTER COLUMN specialization SET NOT NULL;
    ALTER TABLE public.experts ALTER COLUMN expertiselevel SET NOT NULL;
    
    -- Add unique constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'experts' AND constraint_name = 'experts_userid_key'
    ) THEN
        ALTER TABLE public.experts ADD CONSTRAINT experts_userid_key UNIQUE (userid);
    END IF;
    
    -- Ensure foreign key constraint has cascade delete
    ALTER TABLE public.experts DROP CONSTRAINT IF EXISTS experts_userid_fkey;
    ALTER TABLE public.experts ADD CONSTRAINT experts_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(_id) ON DELETE CASCADE;
    
END $$;

-- 4. Update bulk_orders table structure
DO $$
BEGIN
    -- Check and add columns one by one
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bulk_orders' AND column_name = 'pickupdate'
    ) THEN
        ALTER TABLE public.bulk_orders ADD COLUMN pickupdate date;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bulk_orders' AND column_name = 'pickuptime'
    ) THEN
        ALTER TABLE public.bulk_orders ADD COLUMN pickuptime character varying(10);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bulk_orders' AND column_name = 'paymentstatus'
    ) THEN
        ALTER TABLE public.bulk_orders ADD COLUMN paymentstatus character varying(20) DEFAULT 'pending';
    END IF;
    
    -- Ensure foreign key constraints have cascade delete
    ALTER TABLE public.bulk_orders DROP CONSTRAINT IF EXISTS bulk_orders_dealerid_fkey;
    ALTER TABLE public.bulk_orders ADD CONSTRAINT bulk_orders_dealerid_fkey FOREIGN KEY (dealerid) REFERENCES public.dealers(_id) ON DELETE CASCADE;
    
    ALTER TABLE public.bulk_orders DROP CONSTRAINT IF EXISTS bulk_orders_farmerid_fkey;
    ALTER TABLE public.bulk_orders ADD CONSTRAINT bulk_orders_farmerid_fkey FOREIGN KEY (farmerid) REFERENCES public.farmers(_id) ON DELETE CASCADE;
    
END $$;

-- 5. Update bulk_order_items table structure
DO $$
BEGIN
    -- Ensure foreign key constraints have cascade delete
    ALTER TABLE public.bulk_order_items DROP CONSTRAINT IF EXISTS bulk_order_items_bulkorderid_fkey;
    ALTER TABLE public.bulk_order_items ADD CONSTRAINT bulk_order_items_bulkorderid_fkey FOREIGN KEY (bulkorderid) REFERENCES public.bulk_orders(_id) ON DELETE CASCADE;
    
    ALTER TABLE public.bulk_order_items DROP CONSTRAINT IF EXISTS bulk_order_items_productid_fkey;
    ALTER TABLE public.bulk_order_items ADD CONSTRAINT bulk_order_items_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(_id) ON DELETE CASCADE;
    
END $$;

-- 6. Update consultations table structure
DO $$
BEGIN
    -- Check and add columns one by one
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' AND column_name = 'images'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN images text[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' AND column_name = 'durationminutes'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN durationminutes integer DEFAULT 30;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' AND column_name = 'consultationmode'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN consultationmode character varying(20) DEFAULT 'chat';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' AND column_name = 'fee'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN fee numeric(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' AND column_name = 'paymentstatus'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN paymentstatus character varying(20) DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' AND column_name = 'farmerfeedback'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN farmerfeedback text;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' AND column_name = 'rating'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN rating integer;
    END IF;
    
    -- Ensure foreign key constraints have cascade delete
    ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_expertid_fkey;
    ALTER TABLE public.consultations ADD CONSTRAINT consultations_expertid_fkey FOREIGN KEY (expertid) REFERENCES public.experts(_id) ON DELETE CASCADE;
    
    ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_farmerid_fkey;
    ALTER TABLE public.consultations ADD CONSTRAINT consultations_farmerid_fkey FOREIGN KEY (farmerid) REFERENCES public.farmers(_id) ON DELETE CASCADE;
    
END $$;

-- 7. Update consultation_messages table structure
DO $$
BEGIN
    -- Ensure foreign key constraints have cascade delete
    ALTER TABLE public.consultation_messages DROP CONSTRAINT IF EXISTS consultation_messages_consultationid_fkey;
    ALTER TABLE public.consultation_messages ADD CONSTRAINT consultation_messages_consultationid_fkey FOREIGN KEY (consultationid) REFERENCES public.consultations(_id) ON DELETE CASCADE;
    
    ALTER TABLE public.consultation_messages DROP CONSTRAINT IF EXISTS consultation_messages_senderid_fkey;
    ALTER TABLE public.consultation_messages ADD CONSTRAINT consultation_messages_senderid_fkey FOREIGN KEY (senderid) REFERENCES public.users(_id) ON DELETE CASCADE;
    
END $$;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealers_userid ON public.dealers USING btree (userid);
CREATE INDEX IF NOT EXISTS idx_dealers_businessname ON public.dealers USING btree (businessname);
CREATE INDEX IF NOT EXISTS idx_dealers_isverified ON public.dealers USING btree (isverified);
CREATE INDEX IF NOT EXISTS idx_dealers_ratingaverage ON public.dealers USING btree (ratingaverage);

CREATE INDEX IF NOT EXISTS idx_experts_userid ON public.experts USING btree (userid);
CREATE INDEX IF NOT EXISTS idx_experts_specialization ON public.experts USING btree (specialization);
CREATE INDEX IF NOT EXISTS idx_experts_isverified ON public.experts USING btree (isverified);
CREATE INDEX IF NOT EXISTS idx_experts_availabilitystatus ON public.experts USING btree (availabilitystatus);
CREATE INDEX IF NOT EXISTS idx_experts_ratingaverage ON public.experts USING btree (ratingaverage);

CREATE INDEX IF NOT EXISTS idx_bulk_orders_dealerid ON public.bulk_orders USING btree (dealerid);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_farmerid ON public.bulk_orders USING btree (farmerid);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON public.bulk_orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_createdat ON public.bulk_orders USING btree (createdat);

CREATE INDEX IF NOT EXISTS idx_bulk_order_items_bulkorderid ON public.bulk_order_items USING btree (bulkorderid);
CREATE INDEX IF NOT EXISTS idx_bulk_order_items_productid ON public.bulk_order_items USING btree (productid);

CREATE INDEX IF NOT EXISTS idx_consultations_expertid ON public.consultations USING btree (expertid);
CREATE INDEX IF NOT EXISTS idx_consultations_farmerid ON public.consultations USING btree (farmerid);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduleddate ON public.consultations USING btree (scheduleddate);

CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultationid ON public.consultation_messages USING btree (consultationid);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_senderid ON public.consultation_messages USING btree (senderid);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_createdat ON public.consultation_messages USING btree (createdat);

-- 9. Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dealers_updated_at ON public.dealers;
CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON public.dealers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_experts_updated_at ON public.experts;
CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON public.experts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bulk_orders_updated_at ON public.bulk_orders;
CREATE TRIGGER update_bulk_orders_updated_at BEFORE UPDATE ON public.bulk_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultations_updated_at ON public.consultations;
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

-- 11. Drop existing RLS policies to recreate them
DROP POLICY IF EXISTS "Dealers can view their own profile" ON public.dealers;
DROP POLICY IF EXISTS "Dealers can update their own profile" ON public.dealers;
DROP POLICY IF EXISTS "Admins can view all dealers" ON public.dealers;
DROP POLICY IF EXISTS "Admins can update all dealers" ON public.dealers;
DROP POLICY IF EXISTS "Farmers can view verified dealers" ON public.dealers;

DROP POLICY IF EXISTS "Experts can view their own profile" ON public.experts;
DROP POLICY IF EXISTS "Experts can update their own profile" ON public.experts;
DROP POLICY IF EXISTS "Admins can view all experts" ON public.experts;
DROP POLICY IF EXISTS "Admins can update all experts" ON public.experts;
DROP POLICY IF EXISTS "Farmers can view verified experts" ON public.experts;

DROP POLICY IF EXISTS "Dealers can view their orders" ON public.bulk_orders;
DROP POLICY IF EXISTS "Farmers can view their orders" ON public.bulk_orders;
DROP POLICY IF EXISTS "Dealers can update their orders" ON public.bulk_orders;
DROP POLICY IF EXISTS "Farmers can update their orders" ON public.bulk_orders;
DROP POLICY IF EXISTS "Admins can view all bulk orders" ON public.bulk_orders;

DROP POLICY IF EXISTS "Experts can view their consultations" ON public.consultations;
DROP POLICY IF EXISTS "Farmers can view their consultations" ON public.consultations;
DROP POLICY IF EXISTS "Experts can update their consultations" ON public.consultations;
DROP POLICY IF EXISTS "Farmers can update their consultations" ON public.consultations;
DROP POLICY IF EXISTS "Admins can view all consultations" ON public.consultations;

DROP POLICY IF EXISTS "Users can view messages in their consultations" ON public.consultation_messages;
DROP POLICY IF EXISTS "Users can insert messages in their consultations" ON public.consultation_messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.consultation_messages;

-- 12. Create RLS Policies for dealers table
CREATE POLICY "Dealers can view their own profile" ON public.dealers FOR SELECT USING (auth.uid() = userid);
CREATE POLICY "Dealers can update their own profile" ON public.dealers FOR UPDATE USING (auth.uid() = userid);
CREATE POLICY "Admins can view all dealers" ON public.dealers FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all dealers" ON public.dealers FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));
CREATE POLICY "Farmers can view verified dealers" ON public.dealers FOR SELECT USING (isverified = true);

-- 13. RLS Policies for experts table
CREATE POLICY "Experts can view their own profile" ON public.experts FOR SELECT USING (auth.uid() = userid);
CREATE POLICY "Experts can update their own profile" ON public.experts FOR UPDATE USING (auth.uid() = userid);
CREATE POLICY "Admins can view all experts" ON public.experts FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all experts" ON public.experts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));
CREATE POLICY "Farmers can view verified experts" ON public.experts FOR SELECT USING (isverified = true);

-- 14. RLS Policies for bulk_orders table
CREATE POLICY "Dealers can view their orders" ON public.bulk_orders FOR SELECT USING (dealerid IN (SELECT _id FROM public.dealers WHERE userid = auth.uid()));
CREATE POLICY "Farmers can view their orders" ON public.bulk_orders FOR SELECT USING (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()));
CREATE POLICY "Dealers can update their orders" ON public.bulk_orders FOR UPDATE USING (dealerid IN (SELECT _id FROM public.dealers WHERE userid = auth.uid()));
CREATE POLICY "Farmers can update their orders" ON public.bulk_orders FOR UPDATE USING (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()));
CREATE POLICY "Admins can view all bulk orders" ON public.bulk_orders FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));

-- 15. RLS Policies for consultations table
CREATE POLICY "Experts can view their consultations" ON public.consultations FOR SELECT USING (expertid IN (SELECT _id FROM public.experts WHERE userid = auth.uid()));
CREATE POLICY "Farmers can view their consultations" ON public.consultations FOR SELECT USING (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()));
CREATE POLICY "Experts can update their consultations" ON public.consultations FOR UPDATE USING (expertid IN (SELECT _id FROM public.experts WHERE userid = auth.uid()));
CREATE POLICY "Farmers can update their consultations" ON public.consultations FOR UPDATE USING (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()));
CREATE POLICY "Admins can view all consultations" ON public.consultations FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));

-- 16. RLS Policies for consultation_messages table
CREATE POLICY "Users can view messages in their consultations" ON public.consultation_messages FOR SELECT USING (
  consultationid IN (
    SELECT _id FROM public.consultations 
    WHERE (expertid IN (SELECT _id FROM public.experts WHERE userid = auth.uid())) 
    OR (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()))
  )
);
CREATE POLICY "Users can insert messages in their consultations" ON public.consultation_messages FOR INSERT WITH CHECK (
  consultationid IN (
    SELECT _id FROM public.consultations 
    WHERE (expertid IN (SELECT _id FROM public.experts WHERE userid = auth.uid())) 
    OR (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()))
  )
);
CREATE POLICY "Users can update their messages" ON public.consultation_messages FOR UPDATE USING (senderid = auth.uid());

-- ========================================
-- COMPLETED: Schema updated successfully
-- ========================================
