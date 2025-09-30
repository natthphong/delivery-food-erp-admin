import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const perms = (req as any).permissions as PermissionItem[] | undefined;
  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    return res.status(200).json({ code: "VALIDATION_FAILED", message: "Invalid user id" });
  }

  if (req.method === "GET") {
    const canGet =
      hasPermission(perms, "USERS_ALL", "GET") ||
      hasPermission(perms, "USERS_COMPANY", "GET") ||
      hasPermission(perms, "USERS_BRANCH", "GET");
    if (!canGet) {
      return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
    }
    return res.status(200).json({ code: "OK", message: "success", body: { user: { id, name: "Tar", email: "tar@example.com" } } });
  }

  if (req.method === "POST") {
    const canUpdate =
      hasPermission(perms, "USERS_ALL", "UPDATE") ||
      hasPermission(perms, "USERS_COMPANY", "UPDATE") ||
      hasPermission(perms, "USERS_BRANCH", "UPDATE");
    if (!canUpdate) {
      return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
    }
    return res.status(200).json({ code: "OK", message: "success", body: { id, updated: true } });
  }

  if (req.method === "DELETE") {
    const canDelete =
      hasPermission(perms, "USERS_ALL", "DELETE") ||
      hasPermission(perms, "USERS_COMPANY", "DELETE") ||
      hasPermission(perms, "USERS_BRANCH", "DELETE");
    if (!canDelete) {
      return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
    }
    return res.status(200).json({ code: "OK", message: "success", body: { id, deleted: true } });
  }

  return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
}

export default withAuth(withPermissions(handler));
