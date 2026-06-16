"use client";

import { useId } from "react";
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
  const uid = useId().replace(/:/g, "");
  const lineGradId = `chartLine-${uid}`;
  const fillGradId = `chartFill-${uid}`;

  const prices = data.map((d) => d.price);
  const min = prices.length > 0 ? Math.min(...prices) * 0.998 : 0;
  const max = prices.length > 0 ? Math.max(...prices) * 1.002 : 1;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              range === r
                ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white"
                : "bg-pocket-surface text-zinc-400"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="h-48 w-full">
        {prices.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-black/20 px-4 text-center">
            <p className="text-sm font-medium text-zinc-400">
              Chart data unavailable
            </p>
            <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-zinc-600">
              We couldn&apos;t load live price history for this asset.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 4, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B6EF5" />
                  <stop offset="100%" stopColor="#00C6C6" />
                </linearGradient>
                <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B6EF5" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00C6C6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#1f1f1f"
                strokeDasharray="3 3"
                vertical={false}
              />
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
                width={56}
                tickFormatter={(v) =>
                  v >= 1000
                    ? `${Math.round(v / 1000)}k`
                    : v.toLocaleString("en-US", { maximumFractionDigits: 0 })
                }
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
                stroke={`url(#${lineGradId})`}
                strokeWidth={2}
                fill={`url(#${fillGradId})`}
                dot={false}
                activeDot={{ r: 4, fill: "#00C6C6", stroke: "#3B6EF5" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
