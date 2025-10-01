import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const perms = (req as any).permissions as PermissionItem[] | undefined;

  if (req.method === "GET") {
    const canList =
      hasPermission(perms, "USERS_ALL", "LIST") ||
      hasPermission(perms, "USERS_COMPANY", "LIST") ||
      hasPermission(perms, "USERS_BRANCH", "LIST");
    if (!canList) {
      return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
    }
    return res.status(200).json({
      code: "OK",
      message: "success",
      body: { users: [{ id: 1, name: "Tar", email: "tar@example.com" }] },
    });
  }

  return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
}

export default withAuth(withPermissions(handler));
