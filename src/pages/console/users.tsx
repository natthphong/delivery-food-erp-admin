import { useEffect, useState } from "react";
import ConsoleLayout from "@/components/ConsoleLayout";
import { PAGE_PERMS } from "@/constants/pagePerm";
import { useGate } from "@/utils/permClient";
import { useAppSelector } from "@/store";
import type { ApiErr, ApiOk } from "@/types/auth";

type UserSummary = { id: string; email: string; roles: string[] };
type UsersBody = { users: UserSummary[] };
type UsersEnvelope = (ApiOk<UsersBody> | ApiErr) & Partial<{ body: UsersBody }>;

const UsersPage = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const allowed = useGate(PAGE_PERMS.USERS.anyOf);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);

  useEffect(() => {
    if (!allowed) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/mock/users", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        const payload = (await response.json()) as UsersEnvelope;
        if (!response.ok || payload.code !== "OK" || !payload.body) {
          throw new Error(payload.message ?? "Unable to load users");
        }
        if (!cancelled) {
          setUsers(payload.body.users);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Unable to load users");
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
    <ConsoleLayout title="Users" subtitle="Admin directory" active="users">
      {!allowed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          You do not have permission to view users.
        </div>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Team directory</h2>
              <p className="text-sm text-slate-500">Mock data representing admin accounts.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {loading ? "Loading" : `${users.length} admins`}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">{error}</div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Roles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <span key={role} className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            {role}
                          </span>
                        ))}
                        {!user.roles.length && <span className="text-xs text-slate-400">No roles</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && !loading && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-400">
                      No users available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </ConsoleLayout>
  );
};

export default UsersPage;
