-- Add clerk_user_id to caregivers so each Clerk account maps to exactly one senior
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;
