import type { NextApiRequest, NextApiResponse } from “next”;
import { withAuth } from “@/pages/api/_middleware/withAuth”;
import { withPermissions } from “@/pages/api/_middleware/injectPermissions”;
import { hasPermission } from “@/utils/authz”;
import { getKV, setKV } from “@/repository/mockRepo”;
import { toBangkokIso } from “@/utils/time”;

type R = { code: string; message: string; body?: any };

async function base(req: NextApiRequest, res: NextApiResponse) {
const perms = (req as any).permissions as any[];
const canList =
hasPermission(perms, “ORDER_ALL”, “LIST”) ||
hasPermission(perms, “ORDER_COMPANY”, “LIST”) ||
hasPermission(perms, “ORDER_BRANCH”, “LIST”);
if (!canList) return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });

if (req.method !== “GET”) return res.status(405).json({ code: “METHOD_NOT_ALLOWED”, message: “Method not allowed” });

const kv = (await getKV<{ orders: any[] }>(“orders:list”)) ?? { orders: [] };
// ensure Bangkok timestamps
for (const o of kv.orders) {
if (o.created_at) o.created_at = toBangkokIso(o.created_at);
if (o.updated_at) o.updated_at = toBangkokIso(o.updated_at);
if (o.txn?.expired_at) o.txn.expired_at = toBangkokIso(o.txn.expired_at);
}
return res.status(200).json({ code: “OK”, message: “success”, body: { orders: kv.orders } });
}

export default withAuth(withPermissions(base));
