import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_ERP_URL;
const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_ERP_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error("Supabase ERP credentials are not configured");
}

export const supabaseErp = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
  },
});
