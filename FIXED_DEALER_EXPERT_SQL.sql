-- First, update the users table to include dealer and expert roles
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

-- Create dealers table
CREATE TABLE IF NOT EXISTS public.dealers (
  _id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  userid uuid NOT NULL,
  businessname character varying(255) NOT NULL,
  businesstype character varying(100) NOT NULL,
  licensenumber character varying(100) NOT NULL,
  businessaddress text NOT NULL,
  businesscity character varying(100) NOT NULL,
  businessstate character varying(100) NOT NULL,
  businesspostalcode character varying(20) NOT NULL,
  businessphone character varying(20) NOT NULL,
  businessemail character varying(255) NOT NULL,
  description text,
  minimumorderquantity integer DEFAULT 1,
  servicedeliveryradius integer DEFAULT 50, -- in km
  preferredcrops text[], -- array of preferred crop types
  paymentterms character varying(100) DEFAULT 'COD',
  isverified boolean DEFAULT false,
  verificationdocuments text[], -- array of document URLs
  ratingaverage numeric(3,2) DEFAULT 0.00,
  totalreviews integer DEFAULT 0,
  totaltransactions integer DEFAULT 0,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  constraint dealers_pkey primary key (_id),
  constraint dealers_userid_key unique (userid),
  constraint dealers_userid_fkey foreign key (userid) references public.users(_id) on delete cascade
) TABLESPACE pg_default;

-- Create experts table
CREATE TABLE IF NOT EXISTS public.experts (
  _id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  userid uuid NOT NULL,
  specialization character varying(100) NOT NULL, -- e.g., 'organic_farming', 'pest_management', 'soil_health'
  expertiselevel character varying(50) NOT NULL, -- 'beginner', 'intermediate', 'expert', 'master'
  qualifications text[], -- array of qualifications/certifications
  experienceyears integer DEFAULT 0,
  consultationfee numeric(10,2) DEFAULT 0.00, -- per consultation fee
  availabilitystatus character varying(20) DEFAULT 'available', -- 'available', 'busy', 'offline'
  consultationhours text[], -- e.g., ['9:00-12:00', '14:00-18:00']
  languages text[], -- languages spoken
  description text,
  certificatedocuments text[], -- array of certificate URLs
  isverified boolean DEFAULT false,
  verificationstatus character varying(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  ratingaverage numeric(3,2) DEFAULT 0.00,
  totalconsultations integer DEFAULT 0,
  totalreviews integer DEFAULT 0,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  constraint experts_pkey primary key (_id),
  constraint experts_userid_key unique (userid),
  constraint experts_userid_fkey foreign key (userid) references public.users(_id) on delete cascade
) TABLESPACE pg_default;

-- Create bulk_orders table for dealer-farmer transactions
CREATE TABLE IF NOT EXISTS public.bulk_orders (
  _id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  dealerid uuid NOT NULL,
  farmerid uuid NOT NULL,
  ordernumber character varying(50) NOT NULL,
  totalamount numeric(12,2) NOT NULL,
  status character varying(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'picked_up', 'completed', 'cancelled'
  pickupaddress text NOT NULL,
  pickupcity character varying(100) NOT NULL,
  pickupstate character varying(100) NOT NULL,
  pickuppostalcode character varying(20) NOT NULL,
  pickupdate date,
  pickuptime character varying(10), -- HH:MM format
  notes text,
  paymentmethod character varying(50) DEFAULT 'COD',
  paymentstatus character varying(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  constraint bulk_orders_pkey primary key (_id),
  constraint bulk_orders_dealerid_fkey foreign key (dealerid) references public.dealers(_id) on delete cascade,
  constraint bulk_orders_farmerid_fkey foreign key (farmerid) references public.farmers(_id) on delete cascade
) TABLESPACE pg_default;

-- Create bulk_order_items table
CREATE TABLE IF NOT EXISTS public.bulk_order_items (
  _id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  bulkorderid uuid NOT NULL,
  productid uuid NOT NULL,
  productname character varying(255) NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit character varying(20) NOT NULL, -- 'kg', 'ton', 'pieces', etc.
  unitprice numeric(10,2) NOT NULL,
  totalprice numeric(12,2) NOT NULL,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  constraint bulk_order_items_pkey primary key (_id),
  constraint bulk_order_items_bulkorderid_fkey foreign key (bulkorderid) references public.bulk_orders(_id) on delete cascade,
  constraint bulk_order_items_productid_fkey foreign key (productid) references public.products(_id) on delete cascade
) TABLESPACE pg_default;

-- Create consultations table for expert-farmer interactions
CREATE TABLE IF NOT EXISTS public.consultations (
  _id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  expertid uuid NOT NULL,
  farmerid uuid NOT NULL,
  consultationtype character varying(50) NOT NULL, -- 'crop_issue', 'general_advice', 'soil_analysis', etc.
  title character varying(255) NOT NULL,
  description text NOT NULL,
  images text[], -- array of image URLs
  status character varying(20) DEFAULT 'pending', -- 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
  scheduleddate timestamp without time zone,
  durationminutes integer DEFAULT 30, -- consultation duration in minutes
  consultationmode character varying(20) DEFAULT 'chat', -- 'chat', 'video', 'voice'
  fee numeric(10,2) DEFAULT 0.00,
  paymentstatus character varying(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  notes text,
  farmerfeedback text,
  rating integer, -- 1-5 rating from farmer
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  constraint consultations_pkey primary key (_id),
  constraint consultations_expertid_fkey foreign key (expertid) references public.experts(_id) on delete cascade,
  constraint consultations_farmerid_fkey foreign key (farmerid) references public.farmers(_id) on delete cascade
) TABLESPACE pg_default;

-- Create consultation_messages table for chat history
CREATE TABLE IF NOT EXISTS public.consultation_messages (
  _id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  consultationid uuid NOT NULL,
  senderid uuid NOT NULL, -- user ID of sender (expert or farmer)
  message text NOT NULL,
  messagetype character varying(20) DEFAULT 'text', -- 'text', 'image', 'file'
  fileurl text, -- for image/file messages
  isread boolean DEFAULT false,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  constraint consultation_messages_pkey primary key (_id),
  constraint consultation_messages_consultationid_fkey foreign key (consultationid) references public.consultations(_id) on delete cascade,
  constraint consultation_messages_senderid_fkey foreign key (senderid) references public.users(_id) on delete cascade
) TABLESPACE pg_default;

-- Create indexes for better performance
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

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON public.dealers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON public.experts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bulk_orders_updated_at BEFORE UPDATE ON public.bulk_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dealers table
CREATE POLICY "Dealers can view their own profile" ON public.dealers FOR SELECT USING (auth.uid() = userid);
CREATE POLICY "Dealers can update their own profile" ON public.dealers FOR UPDATE USING (auth.uid() = userid);
CREATE POLICY "Admins can view all dealers" ON public.dealers FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all dealers" ON public.dealers FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));
CREATE POLICY "Farmers can view verified dealers" ON public.dealers FOR SELECT USING (isverified = true);

-- RLS Policies for experts table
CREATE POLICY "Experts can view their own profile" ON public.experts FOR SELECT USING (auth.uid() = userid);
CREATE POLICY "Experts can update their own profile" ON public.experts FOR UPDATE USING (auth.uid() = userid);
CREATE POLICY "Admins can view all experts" ON public.experts FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all experts" ON public.experts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));
CREATE POLICY "Farmers can view verified experts" ON public.experts FOR SELECT USING (isverified = true);

-- RLS Policies for bulk_orders table
CREATE POLICY "Dealers can view their orders" ON public.bulk_orders FOR SELECT USING (dealerid IN (SELECT _id FROM public.dealers WHERE userid = auth.uid()));
CREATE POLICY "Farmers can view their orders" ON public.bulk_orders FOR SELECT USING (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()));
CREATE POLICY "Dealers can update their orders" ON public.bulk_orders FOR UPDATE USING (dealerid IN (SELECT _id FROM public.dealers WHERE userid = auth.uid()));
CREATE POLICY "Farmers can update their orders" ON public.bulk_orders FOR UPDATE USING (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()));
CREATE POLICY "Admins can view all bulk orders" ON public.bulk_orders FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));

-- RLS Policies for consultations table
CREATE POLICY "Experts can view their consultations" ON public.consultations FOR SELECT USING (expertid IN (SELECT _id FROM public.experts WHERE userid = auth.uid()));
CREATE POLICY "Farmers can view their consultations" ON public.consultations FOR SELECT USING (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()));
CREATE POLICY "Experts can update their consultations" ON public.consultations FOR UPDATE USING (expertid IN (SELECT _id FROM public.experts WHERE userid = auth.uid()));
CREATE POLICY "Farmers can update their consultations" ON public.consultations FOR UPDATE USING (farmerid IN (SELECT _id FROM public.farmers WHERE userid = auth.uid()));
CREATE POLICY "Admins can view all consultations" ON public.consultations FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE _id = auth.uid() AND role = 'admin'));

-- RLS Policies for consultation_messages table
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
