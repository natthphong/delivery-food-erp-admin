import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";
import { appendLiveTxn, getKV } from "@/repository/mockRepo";
import { toBangkokIso } from "@/utils/time";

type LiveTxn = {
  id: number;
  ts: string;
  scope: string;
  amount: number;
  companyId?: number;
  branchId?: number;
};

function permForScope(scope: string) {
  if (scope === "ALL") return { obj: "DASH_BROAD_ALL", act: "LIST" };
  if (scope === "COMPANY") return { obj: "DASH_BROAD_COMPANY", act: "LIST" };
  return { obj: "DASH_BROAD_BRANCH", act: "LIST" };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
  }

  const { scope = "ALL", companyId, branchId } = req.query as Record<string, string>;
  const perms = (req as any).permissions as PermissionItem[] | undefined;
  const required = permForScope(scope);
  if (!hasPermission(perms, required.obj, required.act)) {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  }

  try {
    const derivedCompanyId = Number(companyId ?? 1) || 1;
    const derivedBranchId = Number(branchId ?? 1) || 1;

    const nextTxn: LiveTxn = {
      id: Math.floor(Math.random() * 100000),
      ts: toBangkokIso(new Date()),
      scope,
      amount: Math.round(Math.random() * 50000) / 100,
      companyId: derivedCompanyId,
      branchId: derivedBranchId,
    };
    await appendLiveTxn(nextTxn);

    const kv = await getKV<{ items: LiveTxn[] }>("dashboard:liveTxns");
    const allItems = kv?.items ?? [];
    const filtered = allItems.filter((item) => {
      if (scope === "ALL") return true;
      if (scope === "COMPANY") return Number(item.companyId) === derivedCompanyId;
      return Number(item.branchId) === derivedBranchId;
    });

    const items = filtered
      .map((item) => ({
        ...item,
        ts: toBangkokIso(item.ts),
      }))
      .slice(-20);

    return res.status(200).json({ code: "OK", message: "success", body: { items } });
  } catch (error) {
    console.error("dashboard/live error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to load live data" });
  }
}

export default withAuth(withPermissions(handler));
