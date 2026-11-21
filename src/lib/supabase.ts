import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

// Browser client (publishable key — safe to expose)
export const supabase = createClient(url, publishableKey);

// Server-only admin client (secret key — API routes only, bypasses RLS)
export const supabaseAdmin = createClient(url, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
