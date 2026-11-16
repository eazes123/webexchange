-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zohpdublgrayucsfcdaj/editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT,
  password_hash TEXT NOT NULL,
  queue_position INT,
  kyc_status TEXT NOT NULL DEFAULT 'none',
  loan_status TEXT NOT NULL DEFAULT 'none',
  loan_amount NUMERIC DEFAULT 50000,
  activation_fee_paid BOOLEAN DEFAULT FALSE,
  activation_fee_refund_requested BOOLEAN DEFAULT FALSE,
  loan_withdrawn_to_external BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Wallet balances
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  available NUMERIC DEFAULT 0,
  locked NUMERIC DEFAULT 0,
  UNIQUE(user_id, symbol)
);
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'completed',
  date TEXT,
  description TEXT,
  address TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- KYC submissions
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'under_review',
  full_name TEXT,
  dob TEXT,
  address TEXT,
  id_type TEXT,
  id_number TEXT,
  nationality TEXT,
  step INT DEFAULT 5,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Sequence for queue positions
CREATE SEQUENCE IF NOT EXISTS queue_position_seq START 1;
