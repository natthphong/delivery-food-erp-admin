import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";
import { getKV } from "@/repository/mockRepo";
import { toBangkokIso } from "@/utils/time";

type OrderRecord = {
  id: number | string;
  status?: string;
  displayStatus?: string;
  created_at?: string;
  updated_at?: string;
  branch?: { id?: number | string };
  order_details?: { branchId?: string | number };
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
  }

  const perms = (req as any).permissions as PermissionItem[] | undefined;
  const canList =
    hasPermission(perms, "ORDER_ALL", "LIST") ||
    hasPermission(perms, "ORDER_COMPANY", "LIST") ||
    hasPermission(perms, "ORDER_BRANCH", "LIST");
  if (!canList) {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  }

  const { status, branchId, companyId } = req.query as Record<string, string | undefined>;

  try {
    const kv = (await getKV<{ orders: OrderRecord[] }>("orders:list")) ?? { orders: [] };
    const orders = kv.orders
      .filter((order) => {
        if (status && order.status !== status && order.displayStatus !== status) return false;
        if (branchId && String(order.branch?.id ?? order.order_details?.branchId ?? "") !== branchId) return false;
        if (companyId && (order as any)?.branch?.companyId && String((order as any).branch.companyId) !== companyId) {
          return false;
        }
        return true;
      })
      .map((order) => {
        const updated = { ...order } as OrderRecord;
        if (updated.created_at) updated.created_at = toBangkokIso(updated.created_at);
        if (updated.updated_at) updated.updated_at = toBangkokIso(updated.updated_at);
        const txn = (updated as any).txn;
        if (txn?.expired_at) {
          txn.expired_at = toBangkokIso(txn.expired_at);
        }
        return updated;
      });

    return res.status(200).json({ code: "OK", message: "success", body: { orders } });
  } catch (error) {
    console.error("orders/index error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to load orders" });
  }
}

export default withAuth(withPermissions(handler));
