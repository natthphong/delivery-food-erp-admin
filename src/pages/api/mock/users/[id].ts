import type { NextApiRequest, NextApiResponse } from “next”;
import { withAuth } from “@/pages/api/_middleware/withAuth”;
import { withPermissions } from “@/pages/api/_middleware/injectPermissions”;
import { hasPermission } from “@/utils/authz”;

type R = { code: string; message: string; body?: any };

async function base(req: NextApiRequest, res: NextApiResponse) {
const perms = (req as any).permissions as any[];
const id = Number(req.query.id);

if (req.method === “GET”) {
if (!(hasPermission(perms, “USERS_ALL”, “GET”) || hasPermission(perms, “USERS_COMPANY”, “GET”) || hasPermission(perms, “USERS_BRANCH”, “GET”))) {
return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });
}
return res.status(200).json({ code: “OK”, message: “success”, body: { user: { id, name: “Tar”, email: “tar@example.com” } } });
}

if (req.method === “POST”) {
if (!(hasPermission(perms, “USERS_ALL”, “UPDATE”) || hasPermission(perms, “USERS_COMPANY”, “UPDATE”) || hasPermission(perms, “USERS_BRANCH”, “UPDATE”))) {
return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });
}
return res.status(200).json({ code: “OK”, message: “success”, body: { id, updated: true } });
}

if (req.method === “DELETE”) {
if (!(hasPermission(perms, “USERS_ALL”, “DELETE”) || hasPermission(perms, “USERS_COMPANY”, “DELETE”) || hasPermission(perms, “USERS_BRANCH”, “DELETE”))) {
return res.status(403).json({ code: “RBAC_FORBIDDEN”, message: “Insufficient permission” });
}
return res.status(200).json({ code: “OK”, message: “success”, body: { id, deleted: true } });
}

return res.status(405).json({ code: “METHOD_NOT_ALLOWED”, message: “Method not allowed” });
}

export default withAuth(withPermissions(base));
