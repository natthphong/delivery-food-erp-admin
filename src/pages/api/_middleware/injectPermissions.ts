import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getLatestRoleIds, getPermissionsForRoles } from "@/repository/authRepo";
import { aggregatePermissions } from "@/utils/authz";
import type { PermissionItem } from "@/types/auth";

export function withPermissions(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = (req as NextApiRequest & { auth?: { sub?: string } }).auth;
    const sub = auth?.sub;
    if (!sub) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing subject", body: null });
    }

    try {
      const roleIds = await getLatestRoleIds(sub);
      if (!roleIds || !roleIds.length) {
        return res.status(200).json({ code: "NO_ROLE", message: "No role assigned" });
      }

      const { data, error } = await getPermissionsForRoles(roleIds);
      if (error) {
        return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to load permissions" });
      }
      (req as NextApiRequest & { permissions: PermissionItem[] }).permissions = aggregatePermissions(data ?? []);

      return handler(req, res);
    } catch {
      return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to load permissions" });
    }
  };
}
