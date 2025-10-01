import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import api from "@/utils/apiClient";
import { useCan } from "@/utils/permClient";
import NavQuick from "@/components/console/NavQuick";

const MapContainer = dynamic(async () => {
  const mod = await import("react-leaflet");
  return function MapWrapper(props: any) {
    return <mod.MapContainer {...props} />;
  };
}, { ssr: false });

const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, { ssr: false });
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, { ssr: false });
const Popup = dynamic(async () => (await import("react-leaflet")).Popup, { ssr: false });
const Polyline = dynamic(async () => (await import("react-leaflet")).Polyline, { ssr: false });
const Circle = dynamic(async () => (await import("react-leaflet")).Circle, { ssr: false });

type OrderDetail = {
  id: number;
  status: string;
  displayStatus?: string;
  created_at?: string;
  updated_at?: string;
  branch?: { name?: string; lat?: number; lng?: number };
  txn?: { id?: number; status?: string };
  order_details?: {
    productList?: { productName?: string; qty?: number; price?: number }[];
    delivery?: { lat?: number; lng?: number; distanceKm?: number };
  };
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const idParam = router.query.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const can = useCan();
  const canView = can("ORDER_ALL", "GET") || can("ORDER_COMPANY", "GET") || can("ORDER_BRANCH", "GET");
  const canUpdate = can("ORDER_ALL", "UPDATE") || can("ORDER_COMPANY", "UPDATE") || can("ORDER_BRANCH", "UPDATE");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const branchPos = useMemo<[number, number]>(() => {
    if (!order?.branch) return [13.745, 100.534];
    return [Number(order.branch.lat) || 13.745, Number(order.branch.lng) || 100.534];
  }, [order]);

  const dropPos = useMemo<[number, number]>(() => {
    const delivery = order?.order_details?.delivery;
    if (!delivery) return [13.74, 100.5];
    return [Number(delivery.lat) || 13.74, Number(delivery.lng) || 100.5];
  }, [order]);

  useEffect(() => {
    if (!id || !canView) return;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/mock/orders/${id}`);
        if (!isMounted) return;
        if (response.data?.code === "OK") {
          setOrder(response.data.body?.order ?? null);
        } else {
          setOrder(null);
        }
      } catch (error) {
        if (!isMounted) return;
        setOrder(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id, canView]);

  const refresh = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/api/mock/orders/${id}`);
      if (response.data?.code === "OK") {
        setOrder(response.data.body?.order ?? null);
      }
    } catch (error) {
      setOrder(null);
    }
  };

  const confirm = async () => {
    if (!id) return;
    await api.post(`/api/mock/orders/${id}/confirm`, {});
    refresh();
  };

  const reject = async () => {
    if (!id) return;
    await api.post(`/api/mock/orders/${id}/reject`, {});
    refresh();
  };

  if (!canView) {
    return <div className="p-6 text-sm text-slate-600">Permission denied</div>;
  }

  if (loading && !order) {
    return <div className="p-6 text-sm text-slate-600">Loading…</div>;
  }

  if (!order) {
    return <div className="p-6 text-sm text-slate-600">Order not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <NavQuick />

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Order #{order.id}</h1>
            <div className="text-sm text-slate-500">{order.created_at}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded px-2 py-1 text-xs font-semibold uppercase text-slate-600">
              {order.displayStatus ?? order.status}
            </span>
            {canUpdate && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={confirm}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={reject}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">Items</h4>
            <ul className="space-y-2">
              {(order.order_details?.productList ?? []).map((item, idx) => (
                <li key={`${item.productName}-${idx}`} className="flex items-center justify-between rounded border px-3 py-2">
                  <div className="text-sm text-slate-700">
                    {item.productName} ×{item.qty}
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {Number(item.price ?? 0).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Meta</h4>
            <div className="space-y-1 text-sm text-slate-600">
              <div>
                <span className="text-slate-500">Created:</span> {order.created_at ?? "-"}
              </div>
              <div>
                <span className="text-slate-500">Updated:</span> {order.updated_at ?? "-"}
              </div>
              <div>
                <span className="text-slate-500">Branch:</span> {order.branch?.name ?? "-"}
              </div>
              <div>
                <span className="text-slate-500">Txn:</span> #{order.txn?.id} · {order.txn?.status ?? "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[380px] overflow-hidden rounded-xl border bg-white shadow-sm">
        {MapContainer ? (
          <MapContainer center={branchPos} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={branchPos}>
              <Popup>Branch</Popup>
            </Marker>
            <Marker position={dropPos}>
              <Popup>Delivery</Popup>
            </Marker>
            <Polyline pathOptions={{ color: "#1d4ed8" }} positions={[branchPos, dropPos]} />
            <Circle center={dropPos} radius={200} pathOptions={{ color: "#dc2626", fillOpacity: 0.1 }} />
          </MapContainer>
        ) : null}
      </div>
    </div>
  );
}
