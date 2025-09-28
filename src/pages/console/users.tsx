import React, { useEffect, useState } from "react";
import api from "@/utils/apiClient";
import { useGate, useCan } from "@/utils/permClient";
import { PAGE_PERMS } from "@/constants/pagePerm";
import NavQuick from "@/components/console/NavQuick";

type UserRecord = {
  id: number;
  name: string;
  email: string;
};

export default function UsersPage() {
  const allowed = useGate(PAGE_PERMS.USERS.anyOf);
  const can = useCan();
  const canUpdate = can("USERS_ALL", "UPDATE") || can("USERS_COMPANY", "UPDATE") || can("USERS_BRANCH", "UPDATE");
  const canDelete = can("USERS_ALL", "DELETE") || can("USERS_COMPANY", "DELETE") || can("USERS_BRANCH", "DELETE");

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const load = async () => {
    setStatus("loading");
    try {
      const response = await api.get("/api/mock/users");
      if (response.data?.code === "OK") {
        setUsers(response.data.body?.users ?? []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setStatus("idle");
    }
  };

  useEffect(() => {
    if (allowed) {
      load();
    }
  }, [allowed]);

  if (!allowed) {
    return <div className="p-6 text-sm text-slate-600">Permission denied</div>;
  }

  const open = async (id: number) => {
    try {
      const response = await api.get(`/api/mock/users/${id}`);
      if (response.data?.code === "OK") {
        setSelected(response.data.body?.user ?? null);
      }
    } catch (error) {
      setSelected(null);
    }
  };

  const save = async () => {
    if (!selected || !canUpdate) return;
    await api.post(`/api/mock/users/${selected.id}`, selected);
    load();
  };

  const remove = async (id: number) => {
    if (!canDelete) return;
    await api.delete(`/api/mock/users/${id}`);
    if (selected?.id === id) setSelected(null);
    load();
  };

  return (
    <div className="grid gap-6 p-6 md:grid-cols-[260px,1fr]">
      <div className="md:col-span-2">
        <NavQuick />
      </div>

      <div className="space-y-3">
        <h1 className="text-lg font-semibold text-slate-800">Users</h1>
        {status === "loading" && <div className="text-sm text-slate-500">Loading…</div>}
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm shadow-sm">
              <div>
                <div className="font-medium text-slate-800">{user.name}</div>
                <div className="text-slate-500">{user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => open(user.id)}
                >
                  Open
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => remove(user.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && status === "idle" && (
            <div className="rounded border border-dashed px-3 py-6 text-center text-sm text-slate-400">
              No users
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">Details</h2>
        {!selected ? (
          <div className="text-sm text-slate-500">Select a user…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="user-name">
                Name
              </label>
              <input
                id="user-name"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={selected.name}
                onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                disabled={!canUpdate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="user-email">
                Email
              </label>
              <input
                id="user-email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={selected.email}
                onChange={(e) => setSelected({ ...selected, email: e.target.value })}
                disabled={!canUpdate}
              />
            </div>
            {canUpdate ? (
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={save}
              >
                Save
              </button>
            ) : (
              <div className="text-xs text-slate-400">Permission denied</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
