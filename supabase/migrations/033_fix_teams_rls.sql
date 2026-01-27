-- ================================================
-- Fix Teams Table RLS
-- Allow public read access to teams table so that landing page and dashboard routing works without login
-- ================================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON sport.teams;
DROP POLICY IF EXISTS "Public can view teams" ON sport.teams;

-- Create new policy allowing SELECT for everyone
CREATE POLICY "Public can view teams" 
ON sport.teams FOR SELECT 
USING (true);

-- Ensure RLS is enabled (should already be, but safe to check)
ALTER TABLE sport.teams ENABLE ROW LEVEL SECURITY;
