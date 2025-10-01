import React, { useEffect, useState } from "react";
import api from "@/utils/apiClient";
import { useGate, useCan } from "@/utils/permClient";
import { PAGE_PERMS } from "@/constants/pagePerm";
import NavQuick from "@/components/console/NavQuick";

type BranchPayload = {
  branch: {
    id: number;
    name: string;
    address_line?: string;
    is_force_closed: boolean;
    open_hours: Record<string, [string, string][]>;
  };
  menu: Array<{
    product_id: number;
    name: string;
    price: string;
    is_enabled: boolean;
    stock_qty: number | null;
  }>;
  page: number;
  size: number;
  total: number;
};

export default function BranchPage() {
  const allowed = useGate(PAGE_PERMS.BRANCH.anyOf);
  const can = useCan();
  const canUpdate = can("BRANCH_ALL", "UPDATE") || can("BRANCH_COMPANY", "UPDATE") || can("BRANCH_BRANCH", "UPDATE");

  const [branchId, setBranchId] = useState<number>(2);
  const [payload, setPayload] = useState<BranchPayload | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const load = async (id: number) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await api.get(`/api/mock/branch/${id}`);
      if (response.data?.code === "OK") {
        setPayload(response.data.body as BranchPayload);
        setStatus("idle");
      } else {
        setPayload(null);
        setStatus("error");
        setErrorMessage(response.data?.message ?? "Unable to load branch");
      }
    } catch (error) {
      setPayload(null);
      setStatus("error");
      setErrorMessage("Unable to load branch");
    }
  };

  useEffect(() => {
    if (!allowed) return;
    load(branchId);
  }, [allowed, branchId]);

  if (!allowed) {
    return <div className="p-6 text-sm text-slate-600">Permission denied</div>;
  }

  const handleBranchChange = (value: string) => {
    const next = Number(value);
    setBranchId(Number.isFinite(next) ? next : branchId);
  };

  const toggleOpen = async () => {
    try {
      await api.post(`/api/mock/branch/${branchId}/toggle`, {});
      load(branchId);
    } catch (error) {
      // ignore
    }
  };

  const updateHours = async () => {
    if (!payload) return;
    const existing = JSON.stringify(payload.branch.open_hours, null, 2);
    const next = typeof window !== "undefined" ? window.prompt("Paste open_hours JSON", existing) : null;
    if (!next) return;
    try {
      const parsed = JSON.parse(next);
      await api.post(`/api/mock/branch/${branchId}/open-hours`, { open_hours: parsed });
      load(branchId);
    } catch (error) {
      if (typeof window !== "undefined") {
        window.alert("Invalid JSON");
      }
    }
  };

  const toggleProduct = async (productId: number) => {
    try {
      await api.post(`/api/mock/branch/${branchId}/menu/${productId}/toggle`, {});
      load(branchId);
    } catch (error) {
      // ignore
    }
  };

  const setStock = async (productId: number) => {
    const next = typeof window !== "undefined" ? window.prompt("Set stock_qty (number or empty for null)", "") : null;
    if (next === null) return;
    const value = next.trim() === "" ? null : Number(next);
    try {
      await api.post(`/api/mock/branch/${branchId}/menu/${productId}/stock`, { stock_qty: value });
      load(branchId);
    } catch (error) {
      // ignore
    }
  };

  return (
    <div className="space-y-6 p-6">
      <NavQuick />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="branch-id">
            Branch ID
          </label>
          <input
            id="branch-id"
            type="number"
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2"
            value={branchId}
            onChange={(e) => handleBranchChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => load(branchId)}
        >
          Load
        </button>
      </div>

      {status === "loading" && <div className="text-sm text-slate-500">Loading…</div>}
      {status === "error" && <div className="text-sm text-red-600">{errorMessage || "Permission denied"}</div>}

      {payload && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{payload.branch.name}</h3>
              <div className="mt-2 text-sm text-slate-600">{payload.branch.address_line ?? ""}</div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-1 text-xs ${
                  payload.branch.is_force_closed
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {payload.branch.is_force_closed ? "Closed" : "Open"}
              </span>
              {canUpdate && (
                <>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={toggleOpen}
                  >
                    Toggle
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={updateHours}
                  >
                    Edit Hours
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-2 font-medium text-slate-700">Menu</h4>
            <div className="overflow-auto rounded border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Price</th>
                    <th className="px-3 py-2 text-left">Enabled</th>
                    <th className="px-3 py-2 text-left">Stock</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.menu.map((item) => (
                    <tr key={item.product_id} className="border-t">
                      <td className="px-3 py-2">{item.product_id}</td>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.price}</td>
                      <td className="px-3 py-2">{item.is_enabled ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">{item.stock_qty ?? "-"}</td>
                      <td className="px-3 py-2 text-right">
                        {canUpdate ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => toggleProduct(item.product_id)}
                            >
                              Toggle
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setStock(item.product_id)}
                            >
                              Stock
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Permission denied</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Page {payload.page} · Size {payload.size} · Total {payload.total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
