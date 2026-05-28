-- schema.sql — reOWN Spends SQL Schema

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(60) NOT NULL, -- Enum-enforced at app layer
    paid_by VARCHAR(60) NOT NULL,   -- Enum-enforced at app layer
    vendor VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    receipt_path TEXT,              -- Supabase Storage path
    receipt_name VARCHAR(255),      -- Original filename
    logged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATED', 'UPDATED', 'DELETED')),
    entity VARCHAR(50) NOT NULL DEFAULT 'expense',
    entity_id UUID NOT NULL,
    snapshot JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) if needed, but since this is a private internal tool, 
-- we will use direct JWT authentication and verify user identity in our Next.js backend.
-- To allow the serverless functions (which connect using service role or anonymous role) to query,
-- we can keep RLS disabled for convenience, or enable it and write custom policies.
-- Per the spec, we use service role key for system actions and anon key + user token for operations.
-- For maximum simplicity and reliable execution in free tier, we will control access inside our Next.js middleware and API layer.
