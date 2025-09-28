import type { NextApiRequest, NextApiResponse } from “next”;
import { withAuth } from “@/pages/api/_middleware/withAuth”;
import { withPermissions } from “@/pages/api/_middleware/injectPermissions”;
import { hasPermission } from “@/utils/authz”;
import { getKV } from “@/repository/mockRepo”;

type R = { code: string; message: string; body?: any };

function allowed(perms: any[]) {
return hasPermission(perms, “BRANCH_ALL”, “GET”) ||
hasPermission(perms, “BRANCH_COMPANY”, “GET”) ||
hasPermission(perms, “BRANCH_BRANCH”, “GET”);
}

async function base(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== “GET”) return res.status(405).json({ code: “METHOD_NOT_ALLOWED”, message: “Method not allowed” });

const perms = (req as any).permissions as any[];
if (!allowed(perms)) return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });

const branchId = String(req.query.branchId);
// Mock rule for BRANCH_BRANCH: only allow branchId=1
if (hasPermission(perms, “BRANCH_BRANCH”, “GET”) && !hasPermission(perms, “BRANCH_ALL”, “GET”) && !hasPermission(perms, “BRANCH_COMPANY”, “GET”)) {
if (branchId !== “1”) return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Branch restricted” });
}

const data = await getKV(branch:${branchId}:detail);
if (!data) return res.status(200).json({ code: “NOT_FOUND”, message: “Branch not found” });
return res.status(200).json({ code: “OK”, message: “success”, body: data });
}

export default withAuth(withPermissions(base));
