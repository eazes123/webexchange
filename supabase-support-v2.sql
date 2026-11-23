-- Run this in Supabase SQL Editor (adds agent_name column)
ALTER TABLE support_chats ADD COLUMN IF NOT EXISTS agent_name TEXT;
