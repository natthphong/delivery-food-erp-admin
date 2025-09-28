import { useEffect, useState } from "react";
import ConsoleLayout from "@/components/ConsoleLayout";
import { PAGE_PERMS } from "@/constants/pagePerm";
import { useGate } from "@/utils/permClient";
import { useAppSelector } from "@/store";
import type { ApiErr, ApiOk } from "@/types/auth";

type OrderSummary = { id: string; branch: string; status: string; total: number };
type OrdersBody = { orders: OrderSummary[] };
type OrdersEnvelope = (ApiOk<OrdersBody> | ApiErr) & Partial<{ body: OrdersBody }>;

const OrdersPage = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const allowed = useGate(PAGE_PERMS.ORDERS.anyOf);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    if (!allowed) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/mock/orders", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        const payload = (await response.json()) as OrdersEnvelope;
        if (!response.ok || payload.code !== "OK" || !payload.body) {
          throw new Error(payload.message ?? "Unable to load orders");
        }
        if (!cancelled) {
          setOrders(payload.body.orders);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Unable to load orders");
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
    <ConsoleLayout title="Orders" subtitle="Mock orders feed" active="orders">
      {!allowed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          You do not have permission to view orders.
        </div>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
              <p className="text-sm text-slate-500">Sample payload resolved via RBAC-protected API.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {loading ? "Loading" : `${orders.length} records`}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">{error}</div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Branch</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{order.id}</td>
                    <td className="px-4 py-3 text-slate-600">{order.branch}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {order.total.toLocaleString("en-US", { style: "currency", currency: "THB" })}
                    </td>
                  </tr>
                ))}
                {!orders.length && !loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No mock orders available.
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

export default OrdersPage;
