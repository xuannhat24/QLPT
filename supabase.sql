-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  tenant_id uuid,
  room_id uuid,
  start_date date NOT NULL,
  end_date date NOT NULL,
  deposit bigint DEFAULT 0,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id),
  CONSTRAINT contracts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT contracts_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES auth.users(id),
  CONSTRAINT conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES auth.users(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  tenant_id uuid,
  room_id uuid,
  amount bigint NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'unpaid'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id),
  CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT invoices_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  room_id uuid,
  title text NOT NULL,
  description text,
  price bigint NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  area numeric,
  location text,
  type text,
  street text,
  images ARRAY,
  amenities ARRAY,
  electricity_price bigint,
  water_price bigint,
  service_fee bigint,
  deposit bigint,
  latitude numeric,
  longitude numeric,
  approval_status text DEFAULT 'pending'::text CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  CONSTRAINT listings_pkey PRIMARY KEY (id),
  CONSTRAINT listings_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id),
  CONSTRAINT listings_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  title text NOT NULL,
  description text,
  price bigint NOT NULL,
  category text,
  image_url text,
  images ARRAY,
  condition text,
  status text DEFAULT 'available'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  phone text,
  role text CHECK (role = ANY (ARRAY['landlord'::text, 'tenant'::text, 'admin'::text])),
  avatar_url text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid,
  target_id uuid,
  target_type text,
  reason text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'resolved'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  title text NOT NULL,
  price bigint NOT NULL,
  type text,
  area numeric,
  status text DEFAULT 'empty'::text,
  image_url text,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  electricity_price bigint DEFAULT 3500,
  water_price bigint DEFAULT 20000,
  service_fee bigint DEFAULT 150000,
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.support_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  room_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'resolved'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_requests_pkey PRIMARY KEY (id),
  CONSTRAINT support_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES auth.users(id),
  CONSTRAINT support_requests_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT support_requests_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  full_name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT tenants_pkey PRIMARY KEY (id),
  CONSTRAINT tenants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id),
  CONSTRAINT tenants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  location text,
  min_price bigint,
  max_price bigint,
  min_area numeric,
  amenities text,
  room_type text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id)
);