import React from "react";

type Props = {
  chart: "pie" | "bar";
  setChart: (c: "pie" | "bar") => void;
};

export default function ChartSwitcher({ chart, setChart }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700">Chart:</span>
      <button
        type="button"
        className={`rounded-md border px-3 py-1 text-sm ${
          chart === "pie" ? "bg-slate-800 text-white" : "bg-white text-slate-700"
        }`}
        onClick={() => setChart("pie")}
      >
        Pie
      </button>
      <button
        type="button"
        className={`rounded-md border px-3 py-1 text-sm ${
          chart === "bar" ? "bg-slate-800 text-white" : "bg-white text-slate-700"
        }`}
        onClick={() => setChart("bar")}
      >
        Bar
      </button>
    </div>
  );
}
