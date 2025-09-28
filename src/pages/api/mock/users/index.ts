import type { NextApiRequest, NextApiResponse } from “next”;
import { withAuth } from “@/pages/api/_middleware/withAuth”;
import { withPermissions } from “@/pages/api/_middleware/injectPermissions”;
import { hasPermission } from “@/utils/authz”;

type R = { code: string; message: string; body?: any };

async function base(req: NextApiRequest, res: NextApiResponse) {
const perms = (req as any).permissions as any[];
if (req.method === “GET”) {
if (!(hasPermission(perms, “USERS_ALL”, “LIST”) || hasPermission(perms, “USERS_COMPANY”, “LIST”) || hasPermission(perms, “USERS_BRANCH”, “LIST”))) {
return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });
}
return res.status(200).json({ code: “OK”, message: “success”, body: { users: [{ id: 1, name: “Tar”, email: “tar@example.com” }] } });
}
return res.status(405).json({ code: “METHOD_NOT_ALLOWED”, message: “Method not allowed” });
}

export default withAuth(withPermissions(base));
