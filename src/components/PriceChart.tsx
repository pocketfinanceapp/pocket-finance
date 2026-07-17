"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import type { ChartPoint, ChartRange } from "@/lib/types";
import { formatAssetPrice } from "@/lib/utils";

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "1Y", "5Y", "MAX"];

interface PriceChartProps {
  data: ChartPoint[];
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
}

export function PriceChart({ data, range, onRangeChange }: PriceChartProps) {
  const { theme } = useTheme();
  const uid = useId().replace(/:/g, "");
  const lineGradId = `chartLine-${uid}`;
  const fillGradId = `chartFill-${uid}`;

  const chartTheme = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        grid: theme === "light" ? "#e5e7eb" : "#1f1f1f",
        tick: theme === "light" ? "#6b7280" : "#71717a",
        tooltipBg: theme === "light" ? "#ffffff" : "#141414",
        tooltipBorder: theme === "light" ? "rgba(0,0,0,0.1)" : "#262626",
        tooltipLabel: theme === "light" ? "#6b7280" : "#a1a1aa",
      };
    }
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return {
      grid: styles.getPropertyValue("--pocket-chart-grid").trim() || "#1f1f1f",
      tick: styles.getPropertyValue("--pocket-chart-tick").trim() || "#71717a",
      tooltipBg:
        styles.getPropertyValue("--pocket-chart-tooltip-bg").trim() || "#141414",
      tooltipBorder:
        styles.getPropertyValue("--pocket-chart-tooltip-border").trim() ||
        "#262626",
      tooltipLabel: styles.getPropertyValue("--pocket-text-muted").trim() || "#a1a1aa",
    };
  }, [theme]);

  const prices = data.map((d) => d.price);
  const min = prices.length > 0 ? Math.min(...prices) * 0.998 : 0;
  const max = prices.length > 0 ? Math.max(...prices) * 1.002 : 1;
  const tickInterval =
    data.length > 40 ? Math.ceil(data.length / 6) : data.length > 16 ? Math.ceil(data.length / 5) : 0;

  return (
    <div className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-chart-surface)] p-4">
      <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              range === r
                ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white"
                : "bg-[var(--pocket-surface-hover)] text-pocket-muted"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="h-56 w-full">
        {prices.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-4 text-center">
            <p className="text-sm font-medium text-pocket-muted">
              Chart data unavailable
            </p>
            <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-pocket-muted">
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
                stroke={chartTheme.grid}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: chartTheme.tick, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval > 0 ? tickInterval : "preserveStartEnd"}
                minTickGap={24}
              />
              <YAxis
                domain={[min, max]}
                tick={{ fill: chartTheme.tick, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => {
                  if (Math.abs(v) >= 1000) {
                    return `${(v / 1000).toFixed(Math.abs(v) >= 10_000 ? 0 : 1)}k`;
                  }
                  return formatAssetPrice(v);
                }}
              />
              <Tooltip
                contentStyle={{
                  background: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: chartTheme.tooltipLabel }}
                formatter={(value: number) => [
                  formatAssetPrice(value, true),
                  "Price",
                ]}
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
