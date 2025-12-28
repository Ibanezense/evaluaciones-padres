-- =============================================
-- FIX: Allow INSERT on profiles table
-- =============================================
-- Run this in Supabase SQL Editor

-- Option 1: Allow any authenticated user to create profiles
CREATE POLICY "Allow authenticated users to insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Option 2: If you want to allow anonymous users too (for login flow)
-- CREATE POLICY "Allow anyone to insert profiles"
-- ON public.profiles
-- FOR INSERT
-- TO anon, authenticated
-- WITH CHECK (true);

-- Verify policies after running:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
