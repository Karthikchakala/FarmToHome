-- Safe additive migration for smart-agri features

CREATE TABLE IF NOT EXISTS public.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    area NUMERIC NOT NULL CHECK (area > 0),
    location TEXT NOT NULL,
    soil_type VARCHAR,
    soil_ph NUMERIC,
    nitrogen NUMERIC,
    phosphorus NUMERIC,
    potassium NUMERIC,
    water_source VARCHAR,
    current_crop VARCHAR,
    crop_status VARCHAR DEFAULT 'planned',
    planting_date DATE,
    expected_harvest_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fields_user_id ON public.fields(user_id);
CREATE INDEX IF NOT EXISTS idx_fields_current_crop ON public.fields(current_crop);

CREATE TABLE IF NOT EXISTS public.plant_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(_id) ON DELETE CASCADE,
    plant_name VARCHAR,
    condition_name VARCHAR,
    confidence NUMERIC,
    is_healthy BOOLEAN,
    raw_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plant_scans_user_id ON public.plant_scans(user_id);

CREATE TABLE IF NOT EXISTS public.expert_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(_id) ON DELETE SET NULL,
    name VARCHAR NOT NULL,
    specialization VARCHAR NOT NULL,
    region VARCHAR,
    experience_years INTEGER DEFAULT 0,
    languages TEXT[] DEFAULT '{}',
    bio TEXT,
    rating NUMERIC DEFAULT 0,
    availability_status VARCHAR DEFAULT 'available',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expert_profiles_active ON public.expert_profiles(is_active);

CREATE TABLE IF NOT EXISTS public.expert_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID REFERENCES public.expert_profiles(id) ON DELETE SET NULL,
    requester_user_id UUID REFERENCES public.users(_id) ON DELETE SET NULL,
    requester_name VARCHAR NOT NULL,
    requester_email VARCHAR,
    topic VARCHAR NOT NULL,
    message TEXT NOT NULL,
    preferred_contact VARCHAR DEFAULT 'platform',
    status VARCHAR DEFAULT 'queued',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expert_inquiries_expert_id ON public.expert_inquiries(expert_id);
