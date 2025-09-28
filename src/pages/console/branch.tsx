import { useEffect, useState } from "react";
import ConsoleLayout from "@/components/ConsoleLayout";
import { PAGE_PERMS } from "@/constants/pagePerm";
import { useGate } from "@/utils/permClient";
import { useAppSelector } from "@/store";
import type { ApiErr, ApiOk } from "@/types/auth";

type BranchInfo = { id: string; name: string; phone: string };
type BranchBody = { branches: BranchInfo[] };
type BranchEnvelope = (ApiOk<BranchBody> | ApiErr) & Partial<{ body: BranchBody }>;

const BranchPage = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const allowed = useGate(PAGE_PERMS.BRANCHES.anyOf);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);

  useEffect(() => {
    if (!allowed) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/mock/branch", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        const payload = (await response.json()) as BranchEnvelope;
        if (!response.ok || payload.code !== "OK" || !payload.body) {
          throw new Error(payload.message ?? "Unable to load branches");
        }
        if (!cancelled) {
          setBranches(payload.body.branches);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Unable to load branches");
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
    <ConsoleLayout title="Branches" subtitle="Branch directory" active="branches">
      {!allowed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          You do not have permission to view branches.
        </div>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Active branches</h2>
              <p className="text-sm text-slate-500">Mock directory returned through RBAC protection.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {loading ? "Loading" : `${branches.length} entries`}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">{error}</div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {branches.map((branch) => (
              <div key={branch.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <p className="text-base font-semibold text-slate-900">{branch.name}</p>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm text-slate-700">{branch.phone}</p>
              </div>
            ))}
            {!branches.length && !loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-400">
                No branches available.
              </div>
            )}
          </div>
        </section>
      )}
    </ConsoleLayout>
  );
};

export default BranchPage;
