import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/utils/apiClient";
import { useGate } from "@/utils/permClient";
import { PAGE_PERMS } from "@/constants/pagePerm";
import NavQuick from "@/components/console/NavQuick";

type OrderListItem = {
  id: number;
  status: string;
  displayStatus?: string;
  branch?: { name?: string };
  created_at?: string;
};

export default function OrdersPage() {
  const allowed = useGate(PAGE_PERMS.ORDER.anyOf);
  const [orders, setOrders] = useState<OrderListItem[]>([]);

  useEffect(() => {
    if (!allowed) return;
    let isMounted = true;
    const load = async () => {
      try {
        const response = await api.get("/api/mock/orders");
        if (!isMounted) return;
        if (response.data?.code === "OK") {
          setOrders(response.data.body?.orders ?? []);
        }
      } catch (error) {
        if (!isMounted) return;
        setOrders([]);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [allowed]);

  if (!allowed) {
    return <div className="p-6 text-sm text-slate-600">Permission denied</div>;
  }

  return (
    <div className="space-y-4 p-6">
      <NavQuick />

      <h1 className="text-lg font-semibold text-slate-800">Orders</h1>

      <div className="overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Branch</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No orders
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t last:border-b-0">
                  <td className="px-4 py-3">{order.id}</td>
                  <td className="px-4 py-3">{order.displayStatus ?? order.status}</td>
                  <td className="px-4 py-3">{order.branch?.name ?? "-"}</td>
                  <td className="px-4 py-3">{order.created_at ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/console/orders/${order.id}`}
                      className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
