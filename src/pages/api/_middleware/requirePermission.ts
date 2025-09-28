import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/auth";

export function withPermission(objectCode: string, action: string, handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const perms = (req as NextApiRequest & { permissions?: PermissionItem[] }).permissions;
    if (!hasPermission(perms, objectCode, action)) {
      return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
    }

    return handler(req, res);
  };
}
