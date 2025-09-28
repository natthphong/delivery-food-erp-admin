import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { AxiosError } from "axios";
import apiClient from "@/utils/apiClient";
import { clearAuth } from "@/utils/authStorage";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout, setAdmin, type AdminSession } from "@/store/authSlice";

type MeResponse = {
  admin: AdminSession;
};

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/branches", label: "Branches" },
  { href: "/menus", label: "Menus" },
  { href: "/users", label: "Users" },
];

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { admin } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadWhoAmI = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get<MeResponse>("/api/admin/me");
        if (!active) {
          return;
        }
        dispatch(setAdmin(data.admin));
      } catch (err) {
        if (!active) {
          return;
        }

        const axiosError = err as AxiosError<{ error?: string }>;
        if (axiosError.response?.status === 401) {
          dispatch(logout());
          clearAuth();
          void router.replace("/login");
          return;
        }

        setError(
          axiosError.response?.data?.error ?? "Unable to load your admin profile right now. Please try again shortly."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadWhoAmI();
    return () => {
      active = false;
    };
  }, [dispatch, router]);

  return (
    <>
      <Head>
        <title>Baan Admin Console · Dashboard</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Baan Admin Console</p>
              <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </span>
            </div>
          </div>
        </header>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
          <aside className="w-full max-w-xs space-y-4 lg:w-60">
            <nav className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="px-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
              <ul className="mt-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-emerald-50 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-600"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.label}
                        {isActive && <span className="text-xs text-emerald-600">●</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
          <main className="flex-1 space-y-6">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
                {error}
              </div>
            )}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Admin overview</h2>
                  <p className="text-sm text-slate-500">Quick snapshot of your active session.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {loading ? "Fetching profile" : "Session active"}
                </div>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Email</p>
                  <p className="mt-2 text-base font-medium text-slate-900">
                    {loading && !admin ? <span className="text-slate-400">Loading…</span> : admin?.email ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Roles</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {loading && (!admin || admin.roles.length === 0) && <span className="text-slate-400">Loading…</span>}
                    {admin?.roles?.length ? (
                      admin.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      !loading && <span className="text-sm text-slate-400">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500">
              Coming soon: orders metrics, activity feed, and multi-tenant insights.
            </section>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
