import { supabaseErp } from "@/utils/supabaseErp";

export async function getKV<T = unknown>(key: string): Promise<T | null> {
  const { data, error } = await supabaseErp
    .from("tbl_mock_key_value")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  if (!data?.value) return null;
  try {
    return JSON.parse(data.value) as T;
  } catch (parseError) {
    console.error("Failed to parse mock KV", { key, parseError });
    return null;
  }
}

export async function setKV(key: string, value: unknown): Promise<void> {
  const payload = JSON.stringify(value);
  const { error } = await supabaseErp
    .from("tbl_mock_key_value")
    .upsert({ key, value: payload }, { onConflict: "key" });
  if (error) throw error;
}

export async function appendLiveTxn(next: Record<string, unknown>, cap = 100): Promise<{ items: Record<string, unknown>[] }> {
  const key = "dashboard:liveTxns";
  const current = (await getKV<{ items: Record<string, unknown>[] }>(key)) ?? { items: [] };
  current.items.push(next);
  if (current.items.length > cap) {
    current.items = current.items.slice(current.items.length - cap);
  }
  await setKV(key, current);
  return current;
}
