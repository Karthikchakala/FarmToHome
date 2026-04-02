-- Fix vegetable_cost_chart table UUID generation
-- This script will recreate the table with proper UUID generation

-- First, backup existing data if any
CREATE TABLE IF NOT EXISTS vegetable_cost_chart_backup AS 
SELECT * FROM vegetable_cost_chart;

-- Drop the existing table
DROP TABLE IF EXISTS vegetable_cost_chart;

-- Recreate the table with proper UUID generation
CREATE TABLE IF NOT EXISTS public.vegetable_cost_chart (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vegetable_name VARCHAR NOT NULL UNIQUE,
    category VARCHAR,
    base_price NUMERIC NOT NULL CHECK (base_price > 0),
    unit VARCHAR CHECK (unit IN ('kg', 'gram', 'litre', 'piece')),
    min_price NUMERIC GENERATED ALWAYS AS (base_price * 0.9) STORED,
    max_price NUMERIC GENERATED ALWAYS AS (base_price * 1.1) STORED,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(_id),
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restore data from backup if it exists
INSERT INTO vegetable_cost_chart (vegetable_name, category, base_price, unit, is_active, created_by, createdat, updatedat)
SELECT vegetable_name, category, base_price, unit, is_active, created_by, createdat, updatedat
FROM vegetable_cost_chart_backup
WHERE EXISTS (SELECT 1 FROM vegetable_cost_chart_backup);

-- Clean up backup table
DROP TABLE IF EXISTS vegetable_cost_chart_backup;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vegetable_cost_chart_name ON vegetable_cost_chart(vegetable_name);
CREATE INDEX IF NOT EXISTS idx_vegetable_cost_chart_category ON vegetable_cost_chart(category);
CREATE INDEX IF NOT EXISTS idx_vegetable_cost_chart_active ON vegetable_cost_chart(is_active);

-- Grant permissions
GRANT ALL ON vegetable_cost_chart TO authenticated;
GRANT SELECT ON vegetable_cost_chart TO anon;

-- Add RLS policies
ALTER TABLE vegetable_cost_chart ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read cost chart
CREATE POLICY "Allow authenticated users to read cost chart" ON vegetable_cost_chart
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for admins to manage cost chart
CREATE POLICY "Allow admins to manage cost chart" ON vegetable_cost_chart
    FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt()->>'role' = 'admin');

COMMIT;
