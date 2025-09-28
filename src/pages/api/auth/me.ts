import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { supabaseErp } from "@/utils/supabaseErp";
import { getPermissionsForRoles, getRolesByIds, pickLastRoleId } from "@/repository/authRepo";
import { aggregatePermissions } from "@/utils/authz";
import type { AdminProfile, ApiErr, ApiOk } from "@/types/auth";

export type MeResponse = ApiOk<AdminProfile> | ApiErr;

type AuthedRequest = NextApiRequest & { auth?: { sub?: string } };

async function handler(req: AuthedRequest, res: NextApiResponse<MeResponse>) {
  const employeeId = req.auth?.sub;

  if (!employeeId) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing subject" } as ApiErr);
  }

  const { data: employee, error: employeeError } = await supabaseErp
    .from("tbl_employee")
    .select("id,email,username,is_active,role_history")
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Read failure" });
  }

  if (!employee) {
    return res.status(200).json({ code: "INVALID_CREDENTIALS", message: "Account not found" });
  }

  if (!employee.is_active) {
    return res.status(200).json({ code: "USER_INACTIVE", message: "User is not active" });
  }

  const lastRoleId = pickLastRoleId(employee.role_history);
  if (!lastRoleId) {
    return res.status(200).json({ code: "NO_ROLE", message: "No role assigned for this website" });
  }

  const roleIds = [lastRoleId];

  const [{ data: roles, error: rolesError }, { data: permissionsRows, error: permissionsError }] = await Promise.all([
    getRolesByIds(roleIds),
    getPermissionsForRoles(roleIds),
  ]);

  if (rolesError || permissionsError) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to load permissions" });
  }

  const permissions = aggregatePermissions(permissionsRows ?? []);

  const body: AdminProfile = {
    id: employee.id,
    email: employee.email,
    username: employee.username,
    is_active: employee.is_active,
    roles: (roles ?? []).map((role) => ({ id: role.id, code: role.code, name: role.name })),
    permissions,
  };

  return res.status(200).json({ code: "OK", message: "success", body });
}

export default withAuth(handler);
