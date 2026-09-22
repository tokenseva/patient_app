import { createClient } from "@supabase/supabase-js"

// Real Supabase project URL and anon/public key, read from env vars only — never hardcoded
// here, and never the service role key (that belongs only on a trusted backend, not this
// frontend). Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (see .env.example).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project's URL and anon key.",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
