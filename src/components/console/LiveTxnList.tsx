import React from "react";

type Props = {
  items: any[];
};

export default function LiveTxnList({ items }: Props) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Live transactions (last 20)</h3>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Scope</th>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                  No activity yet
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">{it.id}</td>
                  <td className="px-3 py-2">{it.ts}</td>
                  <td className="px-3 py-2">{it.scope}</td>
                  <td className="px-3 py-2">{it.companyId ?? "-"}</td>
                  <td className="px-3 py-2">{it.branchId ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{Number(it.amount).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
