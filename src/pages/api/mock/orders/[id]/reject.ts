import type { NextApiRequest, NextApiResponse } from “next”;
import { withAuth } from “@/pages/api/_middleware/withAuth”;
import { withPermissions } from “@/pages/api/_middleware/injectPermissions”;
import { hasPermission } from “@/utils/authz”;
import { getKV, setKV } from “@/repository/mockRepo”;
import { toBangkokIso } from “@/utils/time”;

type R = { code: string; message: string; body?: any };

async function base(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== “POST”) return res.status(405).json({ code: “METHOD_NOT_ALLOWED”, message: “Method not allowed” });
const perms = (req as any).permissions as any[];
const canUpdate =
hasPermission(perms, “ORDER_ALL”, “UPDATE”) ||
hasPermission(perms, “ORDER_COMPANY”, “UPDATE”) ||
hasPermission(perms, “ORDER_BRANCH”, “UPDATE”);
if (!canUpdate) return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });

const id = Number(req.query.id);
const kv = (await getKV<{ orders: any[] }>(“orders:list”)) ?? { orders: [] };
const o = kv.orders.find(x => Number(x.id) === id);
if (!o) return res.status(200).json({ code: “NOT_FOUND”, message: “Order not found” });
o.status = “REJECTED”; o.displayStatus = “REJECTED”; o.updated_at = toBangkokIso(new Date());
await setKV(“orders:list”, kv);
return res.status(200).json({ code: “OK”, message: “success”, body: { id, status: “REJECTED” } });
}

export default withAuth(withPermissions(base));
