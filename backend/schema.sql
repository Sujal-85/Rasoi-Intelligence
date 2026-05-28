-- Setup initial migrations and tables for Rasoi Intelligence

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurants Table
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    type TEXT,
    location TEXT,
    city TEXT,
    capacity INT DEFAULT 0,
    icon TEXT,
    owner_id UUID,
    ai_usage JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    email TEXT,
    first_visit DATE,
    last_visit DATE,
    total_visits INT DEFAULT 1,
    total_spend DECIMAL(12,2) DEFAULT 0.00,
    segment TEXT DEFAULT 'One-time',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Items Table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_veg BOOLEAN DEFAULT true,
    popularity_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- File Uploads Table
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    file_type TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT DEFAULT 'UPI',
    source_file_id UUID REFERENCES public.file_uploads(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Advanced AI Insights Table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    raw_analysis JSONB DEFAULT '{}'::jsonb,
    confidence_score DECIMAL(5,2) DEFAULT 1.00,
    action_plan JSONB DEFAULT '[]'::jsonb,
    data_points JSONB DEFAULT '{}'::jsonb,
    visual_config JSONB DEFAULT '{}'::jsonb,
    tone TEXT DEFAULT 'green',
    status TEXT DEFAULT 'New',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) on everything to ensure multi-tenancy
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- 1. Restaurants Policies
CREATE POLICY "Users can manage their own restaurant" ON public.restaurants
  FOR ALL TO authenticated USING (
    owner_id = auth.uid() 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 2. Customers Policies
CREATE POLICY "Users can manage customers of their restaurant" ON public.customers
  FOR ALL TO authenticated USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()) 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 3. Items Policies
CREATE POLICY "Users can manage items of their restaurant" ON public.items
  FOR ALL TO authenticated USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()) 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 4. File Uploads Policies
CREATE POLICY "Users can manage file uploads of their restaurant" ON public.file_uploads
  FOR ALL TO authenticated USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()) 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 5. Orders Policies
CREATE POLICY "Users can manage orders of their restaurant" ON public.orders
  FOR ALL TO authenticated USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()) 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 6. Order Items Policies
CREATE POLICY "Users can manage order items of their restaurant" ON public.order_items
  FOR ALL TO authenticated USING (
    order_id IN (
      SELECT id FROM public.orders WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
      )
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 7. AI Insights Policies
CREATE POLICY "Users can manage AI insights of their restaurant" ON public.ai_insights
  FOR ALL TO authenticated USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()) 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

