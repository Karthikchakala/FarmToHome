-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.auditlogs (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  adminid uuid NOT NULL,
  action character varying NOT NULL,
  targetcollection character varying,
  targetid uuid,
  metadata jsonb,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT auditlogs_pkey PRIMARY KEY (_id),
  CONSTRAINT auditlogs_adminid_fkey FOREIGN KEY (adminid) REFERENCES public.users(_id)
);
CREATE TABLE public.consumers (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userid uuid NOT NULL,
  defaultaddressstreet text,
  defaultaddresscity character varying,
  defaultaddressstate character varying,
  defaultaddresspostalcode character varying,
  defaultaddresslocation USER-DEFINED,
  walletbalance numeric DEFAULT 0.00,
  totalorders integer DEFAULT 0,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  consumerid uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT consumers_pkey PRIMARY KEY (_id),
  CONSTRAINT consumers_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(_id)
);
CREATE TABLE public.deliveryzones (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  zonename character varying NOT NULL,
  areapolygon USER-DEFINED,
  isactive boolean DEFAULT true,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT deliveryzones_pkey PRIMARY KEY (_id)
);
CREATE TABLE public.farmers (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userid uuid NOT NULL,
  farmname character varying,
  description text,
  farmingtype character varying CHECK (farmingtype::text = ANY (ARRAY['organic'::character varying, 'natural'::character varying, 'mixed'::character varying]::text[])),
  location USER-DEFINED,
  deliveryradius integer DEFAULT 5000,
  verificationstatus character varying DEFAULT 'pending'::character varying CHECK (verificationstatus::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  ratingaverage numeric DEFAULT 0.00,
  totalreviews integer DEFAULT 0,
  totalsales numeric DEFAULT 0.00,
  commissionrate numeric DEFAULT 5.00,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  isapproved boolean NOT NULL DEFAULT false,
  farmerid uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT farmers_pkey PRIMARY KEY (_id),
  CONSTRAINT farmers_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(_id)
);
CREATE TABLE public.messages (
  _id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  order_id uuid,
  message text NOT NULL,
  message_type character varying DEFAULT 'TEXT'::character varying CHECK (message_type::text = ANY (ARRAY['TEXT'::character varying, 'IMAGE'::character varying, 'FILE'::character varying]::text[])),
  file_url text,
  is_read boolean DEFAULT false,
  read_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT messages_pkey PRIMARY KEY (_id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(_id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(_id),
  CONSTRAINT messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(_id)
);
CREATE TABLE public.notifications (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userid uuid NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['ORDER'::character varying, 'PAYMENT'::character varying, 'SUBSCRIPTION'::character varying, 'SYSTEM'::character varying]::text[])),
  message text NOT NULL,
  referenceid uuid,
  isread boolean DEFAULT false,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (_id),
  CONSTRAINT notifications_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(_id)
);
CREATE TABLE public.orders (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ordernumber character varying NOT NULL UNIQUE,
  consumerid uuid NOT NULL,
  farmerid uuid NOT NULL,
  items jsonb NOT NULL,
  totalamount numeric NOT NULL,
  platformcommission numeric NOT NULL,
  deliverycharge numeric DEFAULT 0.00,
  finalamount numeric NOT NULL,
  deliveryaddressstreet text NOT NULL,
  deliveryaddresscity character varying NOT NULL,
  deliveryaddressstate character varying NOT NULL,
  deliveryaddresspostalcode character varying NOT NULL,
  deliveryaddresslocation USER-DEFINED,
  status character varying DEFAULT 'PLACED'::character varying CHECK (status::text = ANY (ARRAY['PLACED'::character varying, 'CONFIRMED'::character varying, 'PACKED'::character varying, 'OUT_FOR_DELIVERY'::character varying, 'DELIVERED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'FAILED'::character varying, 'DISPUTED'::character varying]::text[])),
  paymentstatus character varying DEFAULT 'PENDING'::character varying CHECK (paymentstatus::text = ANY (ARRAY['PENDING'::character varying, 'PAID'::character varying, 'FAILED'::character varying, 'REFUNDED'::character varying]::text[])),
  paymentmethod character varying CHECK (paymentmethod::text = ANY (ARRAY['COD'::character varying, 'ONLINE'::character varying, 'WALLET'::character varying]::text[])),
  ordertype character varying DEFAULT 'one-time'::character varying CHECK (ordertype::text = ANY (ARRAY['one-time'::character varying, 'subscription'::character varying]::text[])),
  deliveredat timestamp without time zone,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_pkey PRIMARY KEY (_id),
  CONSTRAINT orders_consumerid_fkey FOREIGN KEY (consumerid) REFERENCES public.consumers(_id),
  CONSTRAINT orders_farmerid_fkey FOREIGN KEY (farmerid) REFERENCES public.farmers(_id)
);
CREATE TABLE public.payments (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  orderid uuid NOT NULL,
  transactionid character varying UNIQUE,
  paymentgateway character varying,
  amount numeric NOT NULL,
  status character varying DEFAULT 'INITIATED'::character varying CHECK (status::text = ANY (ARRAY['INITIATED'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying, 'REFUNDED'::character varying]::text[])),
  gatewayresponse jsonb,
  processedat timestamp without time zone,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payments_pkey PRIMARY KEY (_id),
  CONSTRAINT payments_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(_id)
);
CREATE TABLE public.products (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farmerid uuid NOT NULL UNIQUE,
  name character varying NOT NULL,
  description text,
  category character varying,
  unit character varying CHECK (unit::text = ANY (ARRAY['kg'::character varying, 'gram'::character varying, 'litre'::character varying, 'piece'::character varying]::text[])),
  priceperunit numeric NOT NULL,
  stockquantity numeric NOT NULL,
  minorderquantity numeric DEFAULT 1,
  images ARRAY,
  isavailable boolean DEFAULT true,
  harvestdate date,
  expirydate date,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ratingaverage numeric NOT NULL DEFAULT 0.00,
  ratingcount integer NOT NULL DEFAULT 0,
  isfeatured boolean NOT NULL DEFAULT false,
  CONSTRAINT products_pkey PRIMARY KEY (_id),
  CONSTRAINT products_farmerid_fkey FOREIGN KEY (farmerid) REFERENCES public.farmers(_id)
);
CREATE TABLE public.reviews (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farmerid uuid NOT NULL,
  customerid uuid NOT NULL,
  orderid uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reviews_pkey PRIMARY KEY (_id),
  CONSTRAINT reviews_farmerid_fkey FOREIGN KEY (farmerid) REFERENCES public.farmers(_id),
  CONSTRAINT reviews_order_id_fkey FOREIGN KEY (orderid) REFERENCES public.orders(_id),
  CONSTRAINT reviews_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.consumers(_id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.subscriptions (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  consumerid uuid NOT NULL,
  farmerid uuid NOT NULL,
  products jsonb NOT NULL,
  frequency character varying NOT NULL CHECK (frequency::text = ANY (ARRAY['weekly'::character varying, 'monthly'::character varying]::text[])),
  nextdeliverydate date NOT NULL,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'paused'::character varying, 'cancelled'::character varying]::text[])),
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (_id),
  CONSTRAINT subscriptions_consumerid_fkey FOREIGN KEY (consumerid) REFERENCES public.consumers(_id),
  CONSTRAINT subscriptions_farmerid_fkey FOREIGN KEY (farmerid) REFERENCES public.farmers(_id)
);
CREATE TABLE public.users (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying NOT NULL UNIQUE,
  passwordhash character varying NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['farmer'::character varying, 'consumer'::character varying, 'admin'::character varying]::text[])),
  isverified boolean DEFAULT false,
  isbanned boolean DEFAULT false,
  profileimageurl text,
  lastloginat timestamp without time zone,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (_id)
);
CREATE TABLE public.wallettransactions (
  _id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userid uuid NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['CREDIT'::character varying, 'DEBIT'::character varying]::text[])),
  amount numeric NOT NULL,
  referenceid uuid,
  description text,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallettransactions_pkey PRIMARY KEY (_id),
  CONSTRAINT wallettransactions_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(_id)
);
