// Run once: node scripts/migrate.js
// Creates all tables in Supabase via direct PostgreSQL connection

const { Client } = require("pg");

const client = new Client({
  connectionString:
    "postgresql://postgres.zohpdublgrayucsfcdaj:NbdKzRlTk4FdBiUp@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

const SQL = `
-- Users
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

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet balances
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  available NUMERIC DEFAULT 0,
  locked NUMERIC DEFAULT 0,
  UNIQUE(user_id, symbol)
);

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

-- Counter for queue positions
CREATE SEQUENCE IF NOT EXISTS queue_position_seq START 1;
`;

async function main() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");
  await client.query(SQL);
  console.log("✅ All tables created successfully");
  await client.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
