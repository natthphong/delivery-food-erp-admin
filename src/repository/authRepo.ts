import { supabaseErp } from “@/utils/supabaseErp”;

export async function findEmployeeByEmail(email: string) {
return supabaseErp
.from(“tbl_employee”)
.select(“id,email,password_hash,username,is_active,role_history”)
.eq(“email”, email.toLowerCase())
.maybeSingle();
}

export function pickLastRoleId(roleHistory: unknown): number | null {
const arr = Array.isArray(roleHistory) ? roleHistory : null;
if (!arr || arr.length === 0) return null;
const last = arr[arr.length - 1];
const n = typeof last === “number” ? last : Number(last);
return Number.isFinite(n) ? n : null;
}

export async function getLastRoleIdForEmployee(employeeId: string): Promise<number | null> {
const { data, error } = await supabaseErp
.from(“tbl_employee”)
.select(“role_history”)
.eq(“id”, employeeId)
.maybeSingle();
if (error) throw error;
return pickLastRoleId(data?.role_history);
}

export async function getRolesByIds(roleIds: number[]) {
return supabaseErp.from(“tbl_role”).select(“id,code,name”).in(“id”, roleIds);
}

type VPerm = { role_id: number; object_code: string; action_code: string };
export async function getPermissionsForRoles(roleIds: number[]) {
const { data, error } = await supabaseErp
.from(“v_role_permissions”)
.select(“role_id, object_code, action_code”)
.in(“role_id”, roleIds);
if (error) throw error;
return (data ?? []).map((r: VPerm) => ({ role_id: r.role_id, permission: { object_code: r.object_code, action_code: r.action_code } }));
}
