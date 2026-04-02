const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const fixCostChartTable = async () => {
  try {
    console.log('Fixing vegetable_cost_chart table...');

    // Drop existing table
    console.log('Dropping existing table...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS vegetable_cost_chart CASCADE;'
    });

    if (dropError) {
      console.log('Note: Could not drop table (may not exist):', dropError.message);
    }

    // Create new table
    console.log('Creating new table...');
    const createTableSQL = `
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
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.error('Error creating table:', createError);
      return;
    }

    // Create indexes
    console.log('Creating indexes...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_vegetable_cost_chart_name ON vegetable_cost_chart(vegetable_name);
      CREATE INDEX IF NOT EXISTS idx_vegetable_cost_chart_category ON vegetable_cost_chart(category);
      CREATE INDEX IF NOT EXISTS idx_vegetable_cost_chart_active ON vegetable_cost_chart(is_active);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexSQL
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError);
    }

    // Enable RLS
    console.log('Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE vegetable_cost_chart ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    }

    // Create policies
    console.log('Creating policies...');
    const policySQL = `
      DROP POLICY IF EXISTS "Allow authenticated users to read cost chart" ON vegetable_cost_chart;
      DROP POLICY IF EXISTS "Allow admins to manage cost chart" ON vegetable_cost_chart;
      
      CREATE POLICY "Allow authenticated users to read cost chart" ON vegetable_cost_chart
          FOR SELECT USING (auth.role() = 'authenticated');

      CREATE POLICY "Allow admins to manage cost chart" ON vegetable_cost_chart
          FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt()->>'role' = 'admin');
    `;

    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: policySQL
    });

    if (policyError) {
      console.error('Error creating policies:', policyError);
    }

    // Grant permissions
    console.log('Granting permissions...');
    const grantSQL = `
      GRANT ALL ON vegetable_cost_chart TO authenticated;
      GRANT SELECT ON vegetable_cost_chart TO anon;
    `;

    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: grantSQL
    });

    if (grantError) {
      console.error('Error granting permissions:', grantError);
    }

    console.log('✅ vegetable_cost_chart table fixed successfully!');

  } catch (error) {
    console.error('Error fixing table:', error);
  }
};

// Alternative approach using direct SQL execution
const fixTableDirectly = async () => {
  try {
    console.log('Attempting direct table recreation...');

    // Try to insert a test record to see if the table works
    const { data, error } = await supabase
      .from('vegetable_cost_chart')
      .insert({
        vegetable_name: 'test_tomato',
        category: 'vegetables',
        base_price: 50,
        unit: 'kg',
        created_by: null
      })
      .select();

    if (error) {
      console.error('Table test failed:', error);
      
      // If it fails, try to create the table using a different approach
      console.log('Attempting to create table using Supabase Dashboard approach...');
      console.log('Please manually run the SQL in recreate_cost_chart.sql in your Supabase Dashboard:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of recreate_cost_chart.sql');
      console.log('4. Run the SQL script');
      
    } else {
      console.log('✅ Table is working correctly!');
      // Clean up test data
      await supabase
        .from('vegetable_cost_chart')
        .delete()
        .eq('vegetable_name', 'test_tomato');
    }

  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the fix
fixTableDirectly();
