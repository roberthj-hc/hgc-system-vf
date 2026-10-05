"use client"
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts"
import { format, type Row } from "@/lib/analytics/types"
const colors = ["#d97706", "#0d9488", "#6366f1"]
export function ReportChart({
  title,
  data,
  measures,
  kind = "line",
  unit = "money",
}: {
  title: string
  data: Row[]
  measures: { key: string; label: string }[]
  kind?: "line" | "bar"
  unit?: string
}) {
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
      <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={32} />
      <YAxis
        tick={{ fontSize: 11 }}
        width={80}
        tickFormatter={(v) => format(v, unit)}
      />
      <Tooltip formatter={(v) => format(Number(v), unit)} />
      <Legend />
    </>
  )
  return (
    <section className="min-w-0 rounded-xl border bg-card p-5">
      <h2 className="mb-5 text-sm font-semibold">{title}</h2>
      <div className="h-80 min-w-0" role="img" aria-label={title}>
        {!data.length ? (
          <p className="pt-20 text-center text-sm text-muted-foreground">
            Sin datos para graficar.
          </p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            initialDimension={{ width: 640, height: 320 }}
          >
            {kind === "bar" ? (
              <BarChart data={data}>
                {axes}
                {measures.map((m, i) => (
                  <Bar
                    key={m.key}
                    dataKey={m.key}
                    name={m.label}
                    fill={colors[i % 3]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={data}>
                {axes}
                {measures.map((m, i) => (
                  <Line
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    name={m.label}
                    stroke={colors[i % 3]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
