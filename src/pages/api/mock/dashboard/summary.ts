import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/api";
import { getKV } from "@/repository/mockRepo";

type DashboardAll = { total: number; byCompany?: { name: string; sales: number }[] };
type DashboardCompany = { byBranch?: { name: string; sales: number }[] };
type DashboardBranch = { items?: { name: string; revenue: number }[] };

type SummaryResponse = {
  scope: string;
  chart: string;
  data: {
    labels: string[];
    values: number[];
  };
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

  const { scope = "ALL", companyId, branchId, chart = "pie" } = req.query as Record<string, string>;
  const perms = (req as any).permissions as PermissionItem[] | undefined;
  const required = permForScope(scope);
  if (!hasPermission(perms, required.obj, required.act)) {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  }

  let key = "dashboard:all:sales";
  if (scope === "COMPANY") {
    key = `dashboard:company:${companyId ?? 1}:sales`;
  } else if (scope === "BRANCH") {
    key = `dashboard:branch:${branchId ?? 1}:revenueByProduct`;
  }

  try {
    const raw = await getKV<DashboardAll | DashboardCompany | DashboardBranch>(key);
    const labels: string[] = [];
    const values: number[] = [];

    if (scope === "ALL" && raw && "byCompany" in raw && Array.isArray(raw.byCompany)) {
      for (const entry of raw.byCompany) {
        labels.push(entry.name);
        values.push(Number(entry.sales) || 0);
      }
    } else if (scope === "COMPANY" && raw && "byBranch" in raw && Array.isArray(raw.byBranch)) {
      for (const entry of raw.byBranch) {
        labels.push(entry.name);
        values.push(Number(entry.sales) || 0);
      }
    } else if (scope === "BRANCH" && raw && "items" in raw && Array.isArray(raw.items)) {
      for (const entry of raw.items) {
        labels.push(entry.name);
        values.push(Number(entry.revenue) || 0);
      }
    }

    const body: SummaryResponse = {
      scope,
      chart,
      data: {
        labels,
        values,
      },
    };

    return res.status(200).json({ code: "OK", message: "success", body });
  } catch (error) {
    console.error("dashboard/summary error", error);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to load summary" });
  }
}

export default withAuth(withPermissions(handler));
