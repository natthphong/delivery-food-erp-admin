import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";
import { getKV } from "@/repository/mockRepo";

function isAllowed(perms: PermissionItem[] | undefined): boolean {
  return (
    hasPermission(perms, "BRANCH_ALL", "GET") ||
    hasPermission(perms, "BRANCH_COMPANY", "GET") ||
    hasPermission(perms, "BRANCH_BRANCH", "GET")
  );
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
  }

  const perms = (req as any).permissions as PermissionItem[] | undefined;
  if (!isAllowed(perms)) {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  }

  const branchId = String(req.query.branchId ?? "");
  const isBranchOnly =
    hasPermission(perms, "BRANCH_BRANCH", "GET") &&
    !hasPermission(perms, "BRANCH_ALL", "GET") &&
    !hasPermission(perms, "BRANCH_COMPANY", "GET");
  if (isBranchOnly && branchId !== "1") {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Branch restricted" });
  }

  try {
    const key = `branch:${branchId}:detail`;
    const data = await getKV(key);
    if (!data) {
      return res.status(200).json({ code: "NOT_FOUND", message: "Branch not found" });
    }
    return res.status(200).json({ code: "OK", message: "success", body: data });
  } catch (error) {
    console.error("branch/[branchId] error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to load branch" });
  }
}

export default withAuth(withPermissions(handler));
