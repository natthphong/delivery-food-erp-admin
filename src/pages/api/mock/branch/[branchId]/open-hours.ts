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
  const { open_hours } = (req.body ?? {}) as { open_hours?: unknown };
  if (!open_hours || typeof open_hours !== "object") {
    return res.status(200).json({ code: "VALIDATION_FAILED", message: "open_hours required" });
  }

  try {
    const key = `branch:${branchId}:detail`;
    const data = (await getKV<any>(key)) ?? null;
    if (!data) {
      return res.status(200).json({ code: "NOT_FOUND", message: "Branch not found" });
    }
    data.branch.open_hours = open_hours;
    await setKV(key, data);
    return res.status(200).json({ code: "OK", message: "success", body: { branchId: Number(branchId), open_hours } });
  } catch (error) {
    console.error("branch/open-hours error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to update open hours" });
  }
}

export default withAuth(withPermissions(handler));
