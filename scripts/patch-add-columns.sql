-- Run this in Supabase SQL Editor to add the new columns to existing tables
-- https://supabase.com/dashboard/project/zohpdublgrayucsfcdaj/editor

-- New columns on users table (wallet + staking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_index INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stake_amount NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stake_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS staked_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reward_distributed BOOLEAN DEFAULT FALSE;

-- New tables (safe to run even if they already exist)
CREATE TABLE IF NOT EXISTS processed_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL DEFAULT 'USDT',
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE processed_deposits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  destination_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO settings (key, value) VALUES ('withdrawals_enabled', 'true') ON CONFLICT DO NOTHING;
INSERT INTO settings (key, value) VALUES ('campaign_active', 'true') ON CONFLICT DO NOTHING;
