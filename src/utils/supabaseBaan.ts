import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_BAAN_URL;
const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_BAAN_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error("Supabase Baan credentials are not configured");
}

export const supabaseBaan = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
  },
});
