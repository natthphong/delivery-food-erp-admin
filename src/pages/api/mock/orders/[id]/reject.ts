import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";
import { getKV, setKV } from "@/repository/mockRepo";
import { toBangkokIso } from "@/utils/time";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
  }

  const perms = (req as any).permissions as PermissionItem[] | undefined;
  const canUpdate =
    hasPermission(perms, "ORDER_ALL", "UPDATE") ||
    hasPermission(perms, "ORDER_COMPANY", "UPDATE") ||
    hasPermission(perms, "ORDER_BRANCH", "UPDATE");
  if (!canUpdate) {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  }

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    return res.status(200).json({ code: "VALIDATION_FAILED", message: "Invalid order id" });
  }

  try {
    const kv = (await getKV<{ orders: any[] }>("orders:list")) ?? { orders: [] };
    const order = kv.orders.find((entry) => Number(entry.id) === id);
    if (!order) {
      return res.status(200).json({ code: "NOT_FOUND", message: "Order not found" });
    }

    order.status = "REJECTED";
    order.displayStatus = "REJECTED";
    order.updated_at = toBangkokIso(new Date());
    await setKV("orders:list", kv);

    return res.status(200).json({ code: "OK", message: "success", body: { id, status: "REJECTED" } });
  } catch (error) {
    console.error("orders/[id]/reject error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to reject order" });
  }
}

export default withAuth(withPermissions(handler));
