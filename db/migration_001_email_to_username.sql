-- migration_001_email_to_username.sql
-- Migrates the users table from email-based login to username-based login.
-- Run this in the Supabase SQL Editor (Settings > SQL Editor) as a one-time migration.

-- STEP 1: Add the new username column (nullable initially so existing rows aren't rejected)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(60) UNIQUE;

-- STEP 2: Back-fill username from the part before '@' in the existing email column
-- e.g. 'vishnu@reown.sale' → 'vishnu'
UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL;

-- STEP 3: Make username NOT NULL now that all rows have a value
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- STEP 4: Keep the email column for now (safe rollback option) but we no longer use it for login.
-- If you want to clean up email entirely, run:
-- ALTER TABLE users DROP COLUMN email;

-- STEP 5 (optional): Drop the old unique index on email if you want to stop enforcing it
-- ALTER TABLE users DROP CONSTRAINT users_email_key;
-- (Only run if you decide to remove email entirely)
