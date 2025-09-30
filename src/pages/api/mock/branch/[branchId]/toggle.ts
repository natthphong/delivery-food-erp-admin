import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";
import { getKV, setKV } from "@/repository/mockRepo";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
  }

  const perms = (req as any).permissions as PermissionItem[] | undefined;
  const canUpdate =
    hasPermission(perms, "BRANCH_ALL", "UPDATE") ||
    hasPermission(perms, "BRANCH_COMPANY", "UPDATE") ||
    hasPermission(perms, "BRANCH_BRANCH", "UPDATE");
  if (!canUpdate) {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  }

  const branchId = String(req.query.branchId ?? "");
  try {
    const key = `branch:${branchId}:detail`;
    const data = (await getKV<any>(key)) ?? null;
    if (!data) {
      return res.status(200).json({ code: "NOT_FOUND", message: "Branch not found" });
    }

    data.branch.is_force_closed = !data.branch.is_force_closed;
    await setKV(key, data);
    return res.status(200).json({
      code: "OK",
      message: "success",
      body: { branchId: Number(branchId), is_force_closed: data.branch.is_force_closed },
    });
  } catch (error) {
    console.error("branch/toggle error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to toggle branch" });
  }
}

export default withAuth(withPermissions(handler));
