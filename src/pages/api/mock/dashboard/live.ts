import type { NextApiRequest, NextApiResponse } from “next”;
import { withAuth } from “@/pages/api/_middleware/withAuth”;
import { withPermissions } from “@/pages/api/_middleware/injectPermissions”;
import { hasPermission } from “@/utils/authz”;
import { getKV, appendLiveTxn } from “@/repository/mockRepo”;
import { toBangkokIso } from “@/utils/time”;

type R = { code: string; message: string; body?: any };

function permForScope(scope: string) {
if (scope === “ALL”) return { obj: “DASH_BROAD_ALL”, act: “LIST” };
if (scope === “COMPANY”) return { obj: “DASH_BROAD_COMPANY”, act: “LIST” };
return { obj: “DASH_BROAD_BRANCH”, act: “LIST” };
}

async function base(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== “GET”) return res.status(405).json({ code: “METHOD_NOT_ALLOWED”, message: “Method not allowed” });
const { scope = “ALL”, companyId, branchId } = req.query as Record<string, string>;
const perms = (req as any).permissions as any[];
const need = permForScope(scope);
if (!hasPermission(perms, need.obj, need.act)) return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });

// simulate a new txn
const fake = { id: Math.floor(Math.random()*100000), ts: toBangkokIso(new Date()), scope, amount: Math.round(Math.random()*50000)/100, companyId: companyId? Number(companyId):1, branchId: branchId? Number(branchId):1 };
await appendLiveTxn(fake);

const kv = await getKV<{ items: any[] }>(“dashboard:liveTxns”);
const items = (kv?.items ?? []).filter(x =>
scope === “ALL” ? true :
scope === “COMPANY” ? x.companyId === Number(companyId ?? 1) :
x.branchId === Number(branchId ?? 1)
).slice(-20);

return res.status(200).json({ code: “OK”, message: “success”, body: { items } });
}

export default withAuth(withPermissions(base));
