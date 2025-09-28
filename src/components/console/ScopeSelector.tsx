import React from "react";

type Props = {
  scope: "ALL" | "COMPANY" | "BRANCH";
  setScope: (s: "ALL" | "COMPANY" | "BRANCH") => void;
  companyId: number | null;
  setCompanyId: (n: number | null) => void;
  branchId: number | null;
  setBranchId: (n: number | null) => void;
  allowAll: boolean;
  allowCompany: boolean;
  allowBranch: boolean;
};

export default function ScopeSelector({
  scope,
  setScope,
  companyId,
  setCompanyId,
  branchId,
  setBranchId,
  allowAll,
  allowCompany,
  allowBranch,
}: Props) {
  const handleScopeChange = (next: "ALL" | "COMPANY" | "BRANCH") => {
    if (next === "ALL" && !allowAll) return;
    if (next === "COMPANY" && !allowCompany) return;
    if (next === "BRANCH" && !allowBranch) return;
    setScope(next);
  };

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="scope-select">
          Scope
        </label>
        <select
          id="scope-select"
          value={scope}
          onChange={(e) => handleScopeChange(e.target.value as Props["scope"])}
          className="mt-1 rounded-md border border-slate-300 px-3 py-2"
        >
          {allowAll && (
            <option value="ALL">
              ALL
            </option>
          )}
          {allowCompany && (
            <option value="COMPANY">
              COMPANY
            </option>
          )}
          {allowBranch && (
            <option value="BRANCH">
              BRANCH
            </option>
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="company-input">
          Company
        </label>
        <input
          id="company-input"
          type="number"
          disabled={!allowCompany || scope === "ALL"}
          value={companyId ?? ""}
          onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : null)}
          className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          placeholder="1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="branch-input">
          Branch
        </label>
        <input
          id="branch-input"
          type="number"
          disabled={!allowBranch || scope !== "BRANCH"}
          value={branchId ?? ""}
          onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
          className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          placeholder="1"
        />
      </div>
    </div>
  );
}
