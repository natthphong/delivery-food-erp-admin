import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/pages/api/_middleware/withAuth";
import { withPermissions } from "@/pages/api/_middleware/injectPermissions";
import type { PermissionItem } from "@/types/auth";

function handler(req: NextApiRequest & { permissions?: PermissionItem[] }, res: NextApiResponse) {
  const permissions = req.permissions ?? [];
  const canAll = permissions.some(
    (item) => item.object_code === "DASH_BROAD_ALL" && item.action_code.includes("LIST")
  );
  const canCompany = permissions.some(
    (item) => item.object_code === "DASH_BROAD_COMPANY" && item.action_code.includes("LIST")
  );
  const canBranch = permissions.some(
    (item) => item.object_code === "DASH_BROAD_BRANCH" && item.action_code.includes("LIST")
  );

  const body = {
    scope: canAll ? "ALL" : canCompany ? "COMPANY" : canBranch ? "BRANCH" : "NONE",
    totals: {
      allCompanies: canAll ? 1250000.25 : null,
      company: canAll || canCompany ? 512300.1 : null,
      branches:
        canAll || canCompany || canBranch
          ? [
              { branchId: 1, name: "Siam", sales: 210000.55 },
              { branchId: 2, name: "Phra Khanong", sales: 145500 },
            ]
          : [],
    },
  };

  return res.status(200).json({ code: "OK", message: "success", body });
}

export default withAuth(withPermissions(handler));
