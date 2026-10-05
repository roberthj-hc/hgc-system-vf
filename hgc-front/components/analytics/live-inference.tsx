"use client"
import { useState } from "react"
import { Sparkles } from "lucide-react"
import { API_URL } from "@/lib/config"
import { useAuth } from "@/lib/auth-context"
import {
  format,
  type AnalyticsReport,
  type Module,
  type Row,
} from "@/lib/analytics/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReportChart } from "./report-chart"

type Result = {
  value: number
  label: string
  unit: string
  run_id: string
  algorithm: string
  cutoff: string
  limitations: string
  rows?: Row[]
  revenue?: number
  operating_cost?: number
  product_cost?: number
  orders?: number
  price?: number
  units?: number
  support?: string
}
export function LiveInference({
  module,
  data,
  branch,
}: {
  module: Module
  data: AnalyticsReport
  branch: string
}) {
  const { token } = useAuth()
  const customerMode = module === "clv" || module === "churn"
  const first = data.rows[0]
  const [branchId, setBranchId] = useState(
    branch === "all" ? String(data.branches[0]?.id_sucursal || "") : branch
  )
  const [entity, setEntity] = useState(
    String(
      customerMode
        ? first?.id_cliente || ""
        : module === "margin"
          ? `${first?.id_sucursal}:${first?.id_producto}`
          : ""
    )
  )
  const [weeks, setWeeks] = useState(4)
  const [orders, setOrders] = useState(Number(first?.n_pedidos || 1000))
  const [demand, setDemand] = useState(1)
  const [priceChange, setPriceChange] = useState(0)
  const [recency, setRecency] = useState(Number(first?.dias_sin_compra || 0))
  const [frequency, setFrequency] = useState(Number(first?.pedidos_180d || 1))
  const [monetary, setMonetary] = useState(Number(first?.gasto_180d || 0))
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function predict() {
    setBusy(true)
    setError("")
    setResult(null)
    let payload: Record<string, number>
    if (customerMode)
      payload = { id_cliente: Number(entity), recency, frequency, monetary }
    else if (module === "margin") {
      const [id_sucursal, id_producto] = entity.split(":").map(Number)
      payload = { id_sucursal, id_producto, price_change: priceChange }
    } else
      payload = {
        id_sucursal: Number(branchId),
        ...(module === "sales"
          ? { weeks }
          : module === "efficiency"
            ? { orders }
            : { demand_factor: demand }),
      }
    try {
      const response = await fetch(`${API_URL}/api/analytics/${module}/infer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const value = await response.json()
      if (!response.ok) throw new Error(value.error)
      setResult(value)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo ejecutar el modelo"
      )
    } finally {
      setBusy(false)
    }
  }
  function selectCustomer(value: string) {
    setEntity(value)
    setResult(null)
    const row = data.rows.find((r) => String(r.id_cliente) === value)
    setRecency(Number(row?.dias_sin_compra || 0))
    setFrequency(Number(row?.pedidos_180d || 1))
    setMonetary(Number(row?.gasto_180d || 0))
  }
  return (
    <section className="space-y-4 rounded-xl border border-amber-600/25 bg-amber-500/5 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-amber-700" />
        <h2 className="font-semibold">Consultar el modelo entrenado</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Modifica los parámetros y ejecuta una predicción. Los cambios son
        escenarios: no alteran los datos del negocio.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {customerMode ? (
          <>
            <label className="text-sm">
              Cliente de esta página
              <select
                className="mt-2 h-9 w-full rounded-md border bg-background px-2"
                value={entity}
                onChange={(e) => selectCustomer(e.target.value)}
              >
                {data.rows.map((r) => (
                  <option
                    key={String(r.id_cliente)}
                    value={String(r.id_cliente)}
                  >
                    Cliente {r.id_cliente}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Días sin compra
              <Input
                type="number"
                min="0"
                max="180"
                value={recency}
                onChange={(e) => {
                  setRecency(Number(e.target.value))
                  setResult(null)
                }}
              />
            </label>
            <label className="text-sm">
              Pedidos en 180 días
              <Input
                type="number"
                min="1"
                max="10000"
                value={frequency}
                onChange={(e) => {
                  setFrequency(Number(e.target.value))
                  setResult(null)
                }}
              />
            </label>
            <label className="text-sm">
              Gasto en 180 días (Bs.)
              <Input
                type="number"
                min="0"
                max="10000000"
                value={monetary}
                onChange={(e) => {
                  setMonetary(Number(e.target.value))
                  setResult(null)
                }}
              />
            </label>
          </>
        ) : module === "margin" ? (
          <label className="text-sm">
            Producto de esta página
            <select
              className="mt-2 h-9 w-full rounded-md border bg-background px-2"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value)
                setResult(null)
              }}
            >
              {data.rows.map((r) => (
                <option
                  key={`${r.id_sucursal}:${r.id_producto}`}
                  value={`${r.id_sucursal}:${r.id_producto}`}
                >
                  {r.sucursal} · {r.producto}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="text-sm">
            Sucursal del escenario
            <select
              className="mt-2 h-9 w-full rounded-md border bg-background px-2"
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value)
                setResult(null)
              }}
            >
              {data.branches.map((b) => (
                <option key={b.id_sucursal} value={b.id_sucursal}>
                  {b.sucursal}
                </option>
              ))}
            </select>
          </label>
        )}
        {module === "sales" && (
          <label className="text-sm">
            Horizonte (semanas)
            <Input
              type="number"
              min="1"
              max="12"
              value={weeks}
              onChange={(e) => {
                setWeeks(Number(e.target.value))
                setResult(null)
              }}
            />
          </label>
        )}
        {module === "efficiency" && (
          <label className="text-sm">
            Pedidos mensuales
            <Input
              type="number"
              min="1"
              max="1000000"
              value={orders}
              onChange={(e) => {
                setOrders(Number(e.target.value))
                setResult(null)
              }}
            />
          </label>
        )}
        {(module === "profit" || module === "expansion") && (
          <label className="text-sm">
            Factor de demanda (1 = proyección base)
            <Input
              type="number"
              min="0.1"
              max="2"
              step="0.1"
              value={demand}
              onChange={(e) => {
                setDemand(Number(e.target.value))
                setResult(null)
              }}
            />
          </label>
        )}
        {module === "margin" && (
          <label className="text-sm">
            Cambio de precio (%)
            <Input
              type="number"
              min="-10"
              max="10"
              value={Math.round(priceChange * 100)}
              onChange={(e) => {
                setPriceChange(Number(e.target.value) / 100)
                setResult(null)
              }}
            />
          </label>
        )}
      </div>
      <Button
        onClick={predict}
        disabled={busy || ((customerMode || module === "margin") && !entity)}
      >
        {busy ? "Ejecutando modelo…" : "Ejecutar predicción"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {result && (
        <div
          className="space-y-4 rounded-lg border bg-background p-4"
          aria-live="polite"
        >
          <div>
            <p className="text-sm text-muted-foreground">{result.label}</p>
            <p className="mt-1 text-3xl font-semibold">
              {format(result.value, result.unit)}
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            {[
              ["Ingresos", result.revenue, "money"],
              ["Costo operativo", result.operating_cost, "money"],
              ["Productos · estimación", result.product_cost, "money"],
              ["Pedidos", result.orders, "number"],
              ["Precio", result.price, "money"],
              ["Unidades", result.units, "number"],
            ]
              .filter(([, value]) => value !== undefined)
              .map(([label, value, unit]) => (
                <p key={String(label)}>
                  {label}: <strong>{format(value, String(unit))}</strong>
                </p>
              ))}
          </div>
          {result.rows && (
            <ReportChart
              title="Predicción del modelo en el horizonte seleccionado"
              data={result.rows.map((r) => ({
                ...r,
                label: String(r.fecha).slice(0, 10),
              }))}
              measures={[{ key: "ingresos", label: "Ingresos esperados" }]}
            />
          )}
          <p className="text-xs text-muted-foreground">
            {result.algorithm} · datos hasta {result.cutoff} · run{" "}
            {result.run_id}
          </p>
          <p className="text-xs text-muted-foreground">
            {result.limitations} {result.support}
          </p>
        </div>
      )}
    </section>
  )
}
