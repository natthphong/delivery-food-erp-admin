import { supabaseErp } from "@/utils/supabaseErp";

export async function findEmployeeByEmail(email: string) {
  return supabaseErp
    .from("tbl_employee")
    .select("id,email,password_hash,username,is_active")
    .eq("email", email.toLowerCase())
    .maybeSingle();
}

export async function getLatestRoleIds(employeeId: string): Promise<number[] | null> {
  const { data, error } = await supabaseErp
    .from("tbl_role_history")
    .select("role_ids")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const list = (data?.role_ids as number[] | null) ?? null;
  return Array.isArray(list) && list.length ? list : null;
}

export async function getRolesByIds(roleIds: number[]) {
  return supabaseErp.from("tbl_role").select("id,code,name").in("id", roleIds);
}

export async function getPermissionsForRoles(roleIds: number[]) {
  return supabaseErp
    .from("role_permission")
    .select("permission:tbl_permission(object_code,action_code)")
    .in("role_id", roleIds);
}
