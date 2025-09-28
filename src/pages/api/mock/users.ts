import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import { hasPermission } from "@/utils/authz";
import type { PermissionItem } from "@/types/auth";

const SCOPE_CODES = ["USERS_ALL", "USERS_COMPANY", "USERS_BRANCH"];

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

  const permissions = req.permissions ?? [];
  const allowed = SCOPE_CODES.some((code) => hasPermission(permissions, code, action));
  if (!allowed) {
    return res.status(403).json({ code: "RBAC_FORBIDDEN", message: "Insufficient permission" });
  }

  if (req.method === "GET") {
    if (typeof req.query.id === "string") {
      const body = {
        user: {
          id: req.query.id,
          email: "user@baanconsole.app",
          displayName: "Arnon I.",
          roles: ["Branch Manager"],
        },
      };
      return res.status(200).json({ code: "OK", message: "success", body });
    }

    const body = {
      users: [
        { id: "USR-001", email: "arnon@baanconsole.app", roles: ["Owner"] },
        { id: "USR-002", email: "sirikul@baanconsole.app", roles: ["Supervisor"] },
      ],
    };
    return res.status(200).json({ code: "OK", message: "success", body });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const body = { result: "User update mocked" };
    return res.status(200).json({ code: "OK", message: "success", body });
  }

  if (req.method === "DELETE") {
    const body = { result: "User delete mocked" };
    return res.status(200).json({ code: "OK", message: "success", body });
  }

  return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unhandled condition" });
}

export default withAuth(withPermissions(handler));
