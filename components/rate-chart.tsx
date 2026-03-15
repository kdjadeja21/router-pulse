"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RatePoint {
  index: number;
  txRate: number;
  rxRate: number;
  total: number;
}

interface RateChartProps {
  history: RatePoint[];
}

function formatBytesForChart(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB/s`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB/s`;
  }
  return `${bytes.toFixed(0)} B/s`;
}

export function RateChart({ history }: RateChartProps) {
  const data = history.map((point, i) => ({
    ...point,
    name: `#${i + 1}`,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Collecting rate data...
        </p>
      </div>
    );
  }

  return (
    <div className="h-48 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="opacity-20"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            stroke="currentColor"
            className="text-zinc-500"
          />
          <YAxis
            tickFormatter={(v) => formatBytesForChart(v)}
            tick={{ fontSize: 10 }}
            stroke="currentColor"
            className="text-zinc-500"
            width={50}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? formatBytesForChart(value) : String(value ?? "")
            }
            contentStyle={{
              backgroundColor: "var(--color-background)",
              border: "1px solid var(--color-foreground)",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="txRate"
            name="TX"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="rxRate"
            name="RX"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
