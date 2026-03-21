-- Create cart table for shopping cart functionality
CREATE TABLE IF NOT EXISTS public.cart (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES public.users(_id) ON DELETE CASCADE,
    productid UUID NOT NULL REFERENCES public.products(_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userid, productid)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_userid ON public.cart(userid);
CREATE INDEX IF NOT EXISTS idx_cart_productid ON public.cart(productid);

-- Enable RLS on cart table
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to see only their own cart items
CREATE POLICY "Users can only see their own cart items" 
    ON public.cart FOR SELECT 
    USING (auth.uid()::text = userid::text);

-- Create RLS policy to allow users to insert their own cart items
CREATE POLICY "Users can only insert their own cart items" 
    ON public.cart FOR INSERT 
    WITH CHECK (auth.uid()::text = userid::text);

-- Create RLS policy to allow users to update their own cart items
CREATE POLICY "Users can only update their own cart items" 
    ON public.cart FOR UPDATE 
    USING (auth.uid()::text = userid::text);

-- Create RLS policy to allow users to delete their own cart items
CREATE POLICY "Users can only delete their own cart items" 
    ON public.cart FOR DELETE 
    USING (auth.uid()::text = userid::text);

-- Verify table was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'cart';
