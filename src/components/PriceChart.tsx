"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint, ChartRange } from "@/lib/types";

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "1Y", "5Y", "MAX"];

interface PriceChartProps {
  data: ChartPoint[];
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
}

export function PriceChart({ data, range, onRangeChange }: PriceChartProps) {
  const min = Math.min(...data.map((d) => d.price)) * 0.995;
  const max = Math.max(...data.map((d) => d.price)) * 1.005;

  return (
    <div className="mt-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              range === r
                ? "bg-pocket-blue text-white"
                : "bg-pocket-surface text-zinc-400"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-2 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tealGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00c9b7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00c9b7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[min, max]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => v.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                background: "#141414",
                border: "1px solid #262626",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00c9b7"
              strokeWidth={2}
              fill="url(#tealGlow)"
              dot={false}
              activeDot={{ r: 4, fill: "#00f5a0", stroke: "#00c9b7" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
