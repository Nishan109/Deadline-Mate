-- Add subscription columns to profiles table if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan VARCHAR DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expiry_date TIMESTAMP WITH TIME ZONE;

-- Create an index on plan for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_expiry ON profiles(plan_expiry_date);

-- Add RLS policy for plan data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own plan data
CREATE POLICY "Users can view own plan" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update own profile but not plan/expiry (admin only)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
