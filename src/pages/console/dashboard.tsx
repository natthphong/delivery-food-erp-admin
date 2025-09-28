import { useEffect, useState } from "react";
import ConsoleLayout from "@/components/ConsoleLayout";
import { PAGE_PERMS } from "@/constants/pagePerm";
import { useGate } from "@/utils/permClient";
import { useAppSelector } from "@/store";
import type { ApiErr, ApiOk } from "@/types/auth";

type DashboardBody = {
  scope: "ALL" | "COMPANY" | "BRANCH" | "NONE";
  totals: {
    allCompanies: number | null;
    company: number | null;
    branches: { branchId: number; name: string; sales: number }[];
  };
};

type DashboardEnvelope = (ApiOk<DashboardBody> | ApiErr) & Partial<{ body: DashboardBody }>;

const DashboardPage = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const allowed = useGate(PAGE_PERMS.DASHBOARD.anyOf);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardBody | null>(null);

  useEffect(() => {
    if (!allowed) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/mock/dashboard", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        const payload = (await response.json()) as DashboardEnvelope;
        if (!response.ok || payload.code !== "OK" || !payload.body) {
          throw new Error(payload.message ?? "Unable to load dashboard data");
        }
        if (!cancelled) {
          setData(payload.body);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Unable to load dashboard data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, allowed]);

  return (
    <ConsoleLayout title="Dashboard" subtitle="Overview of current operations" active="dashboard">
      {!allowed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          You do not have access to the dashboard.
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">{error}</div>
          )}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Performance snapshot</h2>
                <p className="text-sm text-slate-500">Mock numbers to validate permissions.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {loading ? "Fetching data" : "Live mock"}
              </div>
            </div>
            {data && (
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Scope</p>
                  <p className="mt-2 text-base font-medium text-slate-900">{data.scope}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Company total</p>
                  <p className="mt-2 text-base font-medium text-slate-900">
                    {data.totals.company ? data.totals.company.toLocaleString("en-US", { style: "currency", currency: "THB" }) : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">All companies</p>
                  <p className="mt-2 text-base font-medium text-slate-900">
                    {data.totals.allCompanies
                      ? data.totals.allCompanies.toLocaleString("en-US", { style: "currency", currency: "THB" })
                      : "—"}
                  </p>
                </div>
              </div>
            )}
            {data && data.totals.branches.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-700">Branch performance</p>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {data.totals.branches.map((branch) => (
                    <li key={branch.branchId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{branch.name}</p>
                      <p className="text-xs text-slate-500">Sales</p>
                      <p className="text-base font-medium text-slate-900">
                        {branch.sales.toLocaleString("en-US", { style: "currency", currency: "THB" })}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </>
      )}
    </ConsoleLayout>
  );
};

export default DashboardPage;
