import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/auth";

const SCOPE_CODES = ["BRANCH_ALL", "BRANCH_COMPANY", "BRANCH_BRANCH"];

function resolveAction(req: NextApiRequest) {
  if (req.method === "GET" && typeof req.query.id === "string") {
    return "GET";
  }

  switch (req.method) {
    case "GET":
      return "LIST";
    case "PUT":
    case "PATCH":
      return "UPDATE";
    case "DELETE":
      return "DELETE";
    default:
      return null;
  }
}

function handler(req: NextApiRequest & { permissions?: PermissionItem[] }, res: NextApiResponse) {
  const action = resolveAction(req);
  if (!action) {
    res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
    return res
      .status(405)
      .json({ code: "METHOD_NOT_ALLOWED", message: `Method ${req.method ?? "UNKNOWN"} not allowed` });
  }

  // const permissions = req.permissions ?? [];
  // const allowed = SCOPE_CODES.some((code) => hasPermission(permissions, code, action));
  // if (!allowed) {
  //   return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  // }

  if (req.method === "GET") {
    if (typeof req.query.id === "string") {
      const body = {
        branch: {
          id: req.query.id,
          name: "Siam",
          manager: "Kornkanok T.",
          phone: "+66 2 555 0101",
        },
      };
      return res.status(200).json({ code: "OK", message: "success", body });
    }

    const body = {
      branches: [
        { id: "BR-001", name: "Siam", phone: "+66 2 555 0101" },
        { id: "BR-002", name: "Phra Khanong", phone: "+66 2 555 0202" },
      ],
    };
    return res.status(200).json({ code: "OK", message: "success", body });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const body = { result: "Branch update mocked" };
    return res.status(200).json({ code: "OK", message: "success", body });
  }

  if (req.method === "DELETE") {
    const body = { result: "Branch delete mocked" };
    return res.status(200).json({ code: "OK", message: "success", body });
  }

  return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unhandled condition" });
}

export default withAuth(withPermissions(handler));
