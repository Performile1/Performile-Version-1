-- Enable RLS on all tables and set up policies

-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Stores table policies
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stores"
  ON public.stores FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage their stores"
  ON public.stores
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Products table policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage their products"
  ON public.products
  USING (EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = products.store_id 
    AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = products.store_id 
    AND stores.owner_id = auth.uid()
  ));

-- Orders table policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Store owners can view their store's orders"
  ON public.orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = orders.store_id 
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Order items policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Store owners can view their store's order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id
    AND stores.owner_id = auth.uid()
  ));

-- Function to check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant admin access to specific tables
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to stores"
  ON public.stores
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to products"
  ON public.products
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to orders"
  ON public.orders
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to order_items"
  ON public.order_items
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Drop existing storage policies if they exist
DO $$
BEGIN
  -- Drop the public access policy if it exists
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
    DROP POLICY "Public Access" ON storage.objects;
  END IF;
  
  -- Drop the user upload policy if it exists
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own files' AND tablename = 'objects' AND schemaname = 'storage') THEN
    DROP POLICY "Users can upload their own files" ON storage.objects;
  END IF;
  
  -- Drop the store logo policy if it exists
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Store owners can upload store logos' AND tablename = 'objects' AND schemaname = 'storage') THEN
    DROP POLICY "Store owners can upload store logos" ON storage.objects;
  END IF;
END $$;

-- Create storage policies
CREATE POLICY "Public Access" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'products' OR bucket_id = 'store-logos' OR bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Store owners can upload store logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'store-logos' AND 
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = (storage.foldername(name))[1]::uuid
      AND stores.owner_id = auth.uid()
    )
  );
