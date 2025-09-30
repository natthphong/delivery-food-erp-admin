import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";
import { getKV } from "@/repository/mockRepo";
import { toBangkokIso } from "@/utils/time";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
  }

  const perms = (req as any).permissions as PermissionItem[] | undefined;
  const canGet =
    hasPermission(perms, "ORDER_ALL", "GET") ||
    hasPermission(perms, "ORDER_COMPANY", "GET") ||
    hasPermission(perms, "ORDER_BRANCH", "GET");
  if (!canGet) {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  }

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    return res.status(200).json({ code: "VALIDATION_FAILED", message: "Invalid order id" });
  }

  try {
    const kv = (await getKV<{ orders: any[] }>("orders:list")) ?? { orders: [] };
    const order = kv.orders.find((item) => Number(item.id) === id);
    if (!order) {
      return res.status(200).json({ code: "NOT_FOUND", message: "Order not found" });
    }

    if (order.created_at) order.created_at = toBangkokIso(order.created_at);
    if (order.updated_at) order.updated_at = toBangkokIso(order.updated_at);
    if (order.txn?.expired_at) order.txn.expired_at = toBangkokIso(order.txn.expired_at);

    return res.status(200).json({ code: "OK", message: "success", body: { order } });
  } catch (error) {
    console.error("orders/[id] error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to load order" });
  }
}

export default withAuth(withPermissions(handler));
