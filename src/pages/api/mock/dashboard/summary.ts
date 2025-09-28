import type { NextApiRequest, NextApiResponse } from “next”;
import { withAuth } from “@/pages/api/_middleware/withAuth”;
import { withPermissions } from “@/pages/api/_middleware/injectPermissions”;
import { hasPermission } from “@/utils/authz”;
import { getKV } from “@/repository/mockRepo”;

type R = { code: string; message: string; body?: any };

function permForScope(scope: string) {
if (scope === “ALL”) return { obj: “DASH_BROAD_ALL”, act: “LIST” };
if (scope === “COMPANY”) return { obj: “DASH_BROAD_COMPANY”, act: “LIST” };
return { obj: “DASH_BROAD_BRANCH”, act: “LIST” };
}

async function base(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== “GET”) return res.status(405).json({ code: “METHOD_NOT_ALLOWED”, message: “Method not allowed” });

const { scope = “ALL”, companyId, branchId, chart = “pie” } = req.query as Record<string, string>;
const perms = (req as any).permissions as any[];
const need = permForScope(scope);
if (!hasPermission(perms, need.obj, need.act)) return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });

let key = “”;
if (scope === “ALL”) key = “dashboard:all:sales”;
else if (scope === “COMPANY”) key = dashboard:company:${companyId ?? 1}:sales;
else key = dashboard:branch:${branchId ?? 1}:revenueByProduct;

const data = await getKV(key);
return res.status(200).json({ code: “OK”, message: “success”, body: { scope, chart, data } });
}

export default withAuth(withPermissions(base));
