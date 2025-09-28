import { supabaseErp } from “@/utils/supabaseErp”;

export async function getKV<T = any>(key: string): Promise<T | null> {
const { data, error } = await supabaseErp.from(“tbl_mock_key_value”).select(“value”).eq(“key”, key).maybeSingle();
if (error) throw error;
if (!data?.value) return null;
try { return JSON.parse(data.value) as T; } catch { return null; }
}

export async function setKV(key: string, value: any): Promise {
const payload = JSON.stringify(value);
const { error } = await supabaseErp.from(“tbl_mock_key_value”).upsert({ key, value: payload });
if (error) throw error;
}

export async function appendLiveTxn(next: any, cap = 100) {
const key = “dashboard:liveTxns”;
const cur = (await getKV<{ items: any[] }>(key)) ?? { items: [] };
cur.items.push(next);
if (cur.items.length > cap) cur.items = cur.items.slice(cur.items.length - cap);
await setKV(key, cur);
return cur;
}
