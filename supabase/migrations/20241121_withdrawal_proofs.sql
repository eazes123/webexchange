-- Run this once in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS withdrawal_proof_txns (
  tx_hash          TEXT        PRIMARY KEY,
  from_address     TEXT        NOT NULL,
  to_address       TEXT        NOT NULL,
  amount_raw       BIGINT      NOT NULL,          -- raw TRC-20 units (÷ 10^6 = USDT)
  block_timestamp  BIGINT      NOT NULL,          -- unix milliseconds
  block_number     BIGINT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wpt_timestamp
  ON withdrawal_proof_txns (block_timestamp DESC);
