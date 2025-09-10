-- Fix RLS policies for offers table to allow users to create offers

-- First, check if we need to enable RLS (it might already be enabled)
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view available offers" ON public.offers;
DROP POLICY IF EXISTS "Users can create offers" ON public.offers;
DROP POLICY IF EXISTS "Users can update their own offers" ON public.offers;
DROP POLICY IF EXISTS "Users can delete their own offers" ON public.offers;

-- Create policy to allow users to view all active offers (for browsing)
CREATE POLICY "Users can view available offers" 
ON public.offers 
FOR SELECT 
USING (status = 'active' OR auth.uid() IS NOT NULL);

-- Create policy to allow authenticated users to create offers
CREATE POLICY "Users can create offers" 
ON public.offers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy to allow users to update offers (if we want to allow this)
CREATE POLICY "Users can update offers" 
ON public.offers 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policy to allow users to delete offers (if we want to allow this)
CREATE POLICY "Users can delete offers" 
ON public.offers 
FOR DELETE 
USING (auth.uid() IS NOT NULL);