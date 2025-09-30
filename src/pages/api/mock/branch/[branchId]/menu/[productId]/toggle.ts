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
  const productId = Number(req.query.productId);
  if (!Number.isFinite(productId)) {
    return res.status(200).json({ code: "VALIDATION_FAILED", message: "Invalid product id" });
  }

  try {
    const key = `branch:${branchId}:detail`;
    const data = (await getKV<any>(key)) ?? null;
    if (!data) {
      return res.status(200).json({ code: "NOT_FOUND", message: "Branch not found" });
    }

    const item = data.menu.find((entry: any) => Number(entry.product_id) === productId);
    if (!item) {
      return res.status(200).json({ code: "NOT_FOUND", message: "Product not found" });
    }

    item.is_enabled = !item.is_enabled;
    await setKV(key, data);
    return res.status(200).json({ code: "OK", message: "success", body: { productId, is_enabled: item.is_enabled } });
  } catch (error) {
    console.error("branch/menu/toggle error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to toggle menu item" });
  }
}

export default withAuth(withPermissions(handler));
