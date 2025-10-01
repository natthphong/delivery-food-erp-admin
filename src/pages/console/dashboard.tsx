import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/apiClient";
import { useGate, useCan } from "@/utils/permClient";
import { PAGE_PERMS } from "@/constants/pagePerm";
import ScopeSelector from "@/components/console/ScopeSelector";
import ChartSwitcher from "@/components/console/ChartSwitcher";
import LiveTxnList from "@/components/console/LiveTxnList";
import NavQuick from "@/components/console/NavQuick";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

type Scope = "ALL" | "COMPANY" | "BRANCH";
type ChartType = "pie" | "bar";

type DashboardSummaryResponse = {
  byCompany?: { name: string; sales: number }[];
  byBranch?: { name: string; sales: number }[];
  items?: { name: string; revenue: number }[];
  labels?: string[];
  values?: number[];
};

type LiveTxn = {
  id: number | string;
  ts: string;
  scope: Scope;
  amount: number;
  companyId?: number;
  branchId?: number;
};

export default function DashboardPage() {
  const allowed = useGate(PAGE_PERMS.DASHBOARD.anyOf);
  const can = useCan();
  const canAll = can("DASH_BROAD_ALL", "LIST");
  const canCompany = can("DASH_BROAD_COMPANY", "LIST");
  const canBranch = can("DASH_BROAD_BRANCH", "LIST");

  const [scope, setScope] = useState<Scope>(() => {
    if (canAll) return "ALL";
    if (canCompany) return "COMPANY";
    return "BRANCH";
  });
  const [companyId, setCompanyId] = useState<number | null>(1);
  const [branchId, setBranchId] = useState<number | null>(1);
  const [chart, setChart] = useState<ChartType>("pie");

  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [live, setLive] = useState<LiveTxn[]>([]);

  useEffect(() => {
    if (!canAll && scope === "ALL") {
      setScope(canCompany ? "COMPANY" : "BRANCH");
    } else if (!canCompany && scope === "COMPANY") {
      setScope(canBranch ? "BRANCH" : "ALL");
    } else if (!canBranch && scope === "BRANCH") {
      setScope(canAll ? "ALL" : "COMPANY");
    }
  }, [scope, canAll, canCompany, canBranch]);

  const chartData = useMemo(() => labels.map((name, idx) => ({ name, value: values[idx] ?? 0 })), [labels, values]);

  useEffect(() => {
    if (!allowed) return;
    let isActive = true;
    const load = async () => {
      const params: Record<string, any> = { scope, chart };
      if (scope === "COMPANY") params.companyId = companyId ?? 1;
      if (scope === "BRANCH") params.branchId = branchId ?? 1;
      try {
        const response = await api.get("/api/mock/dashboard/summary", { params });
        if (!isActive) return;
        if (response.data?.code !== "OK") {
          setLabels([]);
          setValues([]);
          return;
        }
        const data: DashboardSummaryResponse | undefined = response.data.body?.data ?? response.data.body;
        if (!data) {
          setLabels([]);
          setValues([]);
          return;
        }
        if (Array.isArray(data.labels) && Array.isArray(data.values)) {
          setLabels(data.labels);
          setValues(data.values.map((v) => Number(v) || 0));
        } else if (scope === "ALL" && Array.isArray(data.byCompany)) {
          setLabels(data.byCompany.map((x) => x.name));
          setValues(data.byCompany.map((x) => Number(x.sales) || 0));
        } else if (scope === "COMPANY" && Array.isArray(data.byBranch)) {
          setLabels(data.byBranch.map((x) => x.name));
          setValues(data.byBranch.map((x) => Number(x.sales) || 0));
        } else if (scope === "BRANCH" && Array.isArray(data.items)) {
          setLabels(data.items.map((x) => x.name));
          setValues(data.items.map((x) => Number(x.revenue) || 0));
        } else {
          setLabels([]);
          setValues([]);
        }
      } catch (error) {
        if (!isActive) return;
        setLabels([]);
        setValues([]);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [allowed, scope, companyId, branchId, chart]);

  useEffect(() => {
    if (!allowed) return;
    let isMounted = true;
    const fetchLive = async () => {
      const params: Record<string, any> = { scope };
      if (scope === "COMPANY") params.companyId = companyId ?? 1;
      if (scope === "BRANCH") params.branchId = branchId ?? 1;
      try {
        const response = await api.get("/api/mock/dashboard/live", { params });
        if (!isMounted) return;
        if (response.data?.code === "OK") {
          setLive(response.data.body?.items ?? []);
        }
      } catch (error) {
        if (!isMounted) return;
        setLive([]);
      }
    };
    fetchLive();
    const id = setInterval(fetchLive, 5000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [allowed, scope, companyId, branchId]);

  if (!allowed) {
    return <div className="p-6 text-sm text-slate-600">Permission denied</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <NavQuick />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScopeSelector
          scope={scope}
          setScope={setScope}
          companyId={companyId}
          setCompanyId={setCompanyId}
          branchId={branchId}
          setBranchId={setBranchId}
          allowAll={canAll}
          allowCompany={canCompany}
          allowBranch={canBranch}
        />
        <ChartSwitcher chart={chart} setChart={setChart} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Summary</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chart === "pie" ? (
                <PieChart>
                  <Pie dataKey="value" data={chartData} nameKey="name" label />
                  <Tooltip />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <LiveTxnList items={live} />
      </div>
    </div>
  );
}
