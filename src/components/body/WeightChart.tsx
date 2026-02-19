"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  date: string;
  weight: number;
  bodyFat?: number;
}

interface WeightChartProps {
  data: DataPoint[];
}

export function WeightChart({ data }: WeightChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    displayDate: format(new Date(d.date), "MMM d"),
  }));

  const hasBodyFat = data.some((d) => d.bodyFat != null && d.bodyFat > 0);

  return (
    <div className="h-64 w-full rounded-2xl border border-border/50 bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="weight"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          {hasBodyFat && (
            <YAxis
              yAxisId="bodyFat"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 50]}
              tickFormatter={(v) => `${v}%`}
            />
          )}
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
            formatter={(value, name) => [
              value != null ? (name === "weight" ? `${Number(value).toFixed(1)} kg` : `${Number(value).toFixed(1)}%`) : "—",
              name === "weight" ? "Weight" : "Body fat",
            ]}
            labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ fill: "var(--chart-1)", r: 4 }}
            activeDot={{ r: 6 }}
          />
          {hasBodyFat && (
            <Line
              yAxisId="bodyFat"
              type="monotone"
              dataKey="bodyFat"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-2)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
