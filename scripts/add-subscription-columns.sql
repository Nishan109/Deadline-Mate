-- Add subscription-related columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expiry_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on plan
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.plan IS 'User subscription plan: free or pro';
COMMENT ON COLUMN profiles.plan_expiry_date IS 'Date when the current plan expires';
