import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { findEmployeeByEmail, getLatestRoleIds, getPermissionsForRoles, getRolesByIds } from "@/repository/authRepo";
import { issueRefreshToken, signAccessToken, type JwtAdminPayload } from "@/utils/jwt";
import { aggregatePermissions } from "@/utils/authz";
import type { ApiErr, ApiOk, LoginOkBody } from "@/types/auth";
import { logger } from "@/utils/logger";

export type LoginResponse = ApiOk<LoginOkBody> | ApiErr;

export default async function handler(req: NextApiRequest, res: NextApiResponse<LoginResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ code: "METHOD_NOT_ALLOWED", message: `Method ${req.method ?? "UNKNOWN"} not allowed` });
  }

  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(200).json({ code: "VALIDATION_FAILED", message: "Email and password are required" });
  }

  try {
    const { data: employee, error: employeeError } = await findEmployeeByEmail(email);
    if (employeeError) {
      logger.error("Failed to lookup employee", employeeError);
      return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unexpected error" });
    }

    if (!employee) {
      return res.status(200).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }

    if (!employee.is_active) {
      return res.status(200).json({ code: "USER_INACTIVE", message: "User is not active" });
    }

    const passwordOk = await bcrypt.compare(password, employee.password_hash);
    if (!passwordOk) {
      return res.status(200).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }

    const roleIds = await getLatestRoleIds(employee.id);
    if (!roleIds || roleIds.length === 0) {
      return res.status(200).json({ code: "NO_ROLE", message: "No role assigned for this website" });
    }

    const [{ data: roles, error: rolesError }, { data: permissionRows, error: permissionsError }] = await Promise.all([
      getRolesByIds(roleIds),
      getPermissionsForRoles(roleIds),
    ]);

    if (rolesError || permissionsError) {
      logger.error("Failed to resolve roles or permissions", { rolesError, permissionsError });
      return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unexpected error" });
    }

    const permissions = aggregatePermissions(permissionRows ?? []);
    const payload: JwtAdminPayload = {
      sub: employee.id,
      email: employee.email,
      username: employee.username,
      roles: roleIds,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = issueRefreshToken(payload);

    const body: LoginOkBody = {
      accessToken,
      refreshToken,
      admin: {
        id: employee.id,
        email: employee.email,
        username: employee.username,
        roles: (roles ?? []).map((role) => ({ id: role.id, code: role.code, name: role.name })),
        permissions,
      },
    };

    return res.status(200).json({ code: "OK", message: "success", body });
  } catch (err) {
    logger.error("Unexpected error during login", err);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unexpected error" });
  }
}
