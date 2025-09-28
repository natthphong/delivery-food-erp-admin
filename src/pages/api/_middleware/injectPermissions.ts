import type { NextApiRequest, NextApiResponse, NextApiHandler } from “next”;
import { getLastRoleIdForEmployee, getPermissionsForRoles } from “@/repository/authRepo”;
import { aggregatePermissions } from “@/utils/authz”;

export function withPermissions(handler: NextApiHandler) {
return async (req: NextApiRequest, res: NextApiResponse) => {
const auth = (req as any).auth as { sub?: string };
const sub = auth?.sub;
if (!sub) return res.status(401).json({ code: “UNAUTHORIZED”, message: “Missing subject” });

const lastRoleId = await getLastRoleIdForEmployee(sub);
if (!lastRoleId) return res.status(200).json({ code: "NO_ROLE", message: "No role" });

const rows = await getPermissionsForRoles([lastRoleId]);
(req as any).permissions = aggregatePermissions(rows);
(req as any).roleId = lastRoleId;
return handler(req, res);

};
}
