import { createClient } from "@supabase/supabase-js";

let client = null;

// Renvoie le client Supabase, ou null si les clés sont absentes ou incorrectes.
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !cle) return null;
  if (!client) {
    try {
      client = createClient(url, cle);
    } catch {
      return null;
    }
  }
  return client;
}
