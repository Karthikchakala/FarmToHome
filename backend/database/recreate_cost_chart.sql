-- Simple fix for vegetable_cost_chart table
-- Drop and recreate with proper structure

DROP TABLE IF EXISTS vegetable_cost_chart CASCADE;

CREATE TABLE vegetable_cost_chart (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vegetable_name VARCHAR NOT NULL UNIQUE,
    category VARCHAR DEFAULT 'vegetables',
    base_price NUMERIC NOT NULL CHECK (base_price > 0),
    unit VARCHAR DEFAULT 'kg' CHECK (unit IN ('kg', 'gram', 'litre', 'piece')),
    min_price NUMERIC GENERATED ALWAYS AS (base_price * 0.9) STORED,
    max_price NUMERIC GENERATED ALWAYS AS (base_price * 1.1) STORED,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(_id),
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_vegetable_cost_chart_name ON vegetable_cost_chart(vegetable_name);
CREATE INDEX idx_vegetable_cost_chart_category ON vegetable_cost_chart(category);
CREATE INDEX idx_vegetable_cost_chart_active ON vegetable_cost_chart(is_active);

-- Enable RLS
ALTER TABLE vegetable_cost_chart ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read cost chart" ON vegetable_cost_chart;
DROP POLICY IF EXISTS "Allow admins to manage cost chart" ON vegetable_cost_chart;

-- Create policies
CREATE POLICY "Allow authenticated users to read cost chart" ON vegetable_cost_chart
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage cost chart" ON vegetable_cost_chart
    FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt()->>'role' = 'admin');

-- Grant permissions
GRANT ALL ON vegetable_cost_chart TO authenticated;
GRANT SELECT ON vegetable_cost_chart TO anon;

-- Create trigger for updatedat
CREATE OR REPLACE FUNCTION update_updatedat_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vegetable_cost_chart_updatedat 
    BEFORE UPDATE ON vegetable_cost_chart 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updatedat_column();
