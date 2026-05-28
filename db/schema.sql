-- schema.sql — reOWN Spends SQL Schema (v2 - username based auth)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (username-based login, no email required)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    username VARCHAR(60) UNIQUE NOT NULL,     -- login identifier (e.g. "vishnu")
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(60) NOT NULL,
    paid_by VARCHAR(60) NOT NULL,
    vendor VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    receipt_path TEXT,
    receipt_name VARCHAR(255),
    logged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATED', 'UPDATED', 'DELETED')),
    entity VARCHAR(50) NOT NULL DEFAULT 'expense',
    entity_id UUID NOT NULL,
    snapshot JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now()
);
