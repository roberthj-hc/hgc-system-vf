"use client"
import { useState } from "react"
import { API_URL } from "@/lib/config"
import { useAuth } from "@/lib/auth-context"
import { format, type Row } from "@/lib/analytics/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
type Result = {
  price: number
  units: number
  contribution: number
  contribution_base: number
  limitations: string
}
export function MarginScenario({ rows }: { rows: Row[] }) {
  const { token } = useAuth()
  const [selected, setSelected] = useState("")
  const [change, setChange] = useState(0)
  const [elasticity, setElasticity] = useState(-1)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const item = rows.find(
    (r) => `${r.id_sucursal}:${r.id_producto}` === selected
  )
  async function simulate() {
    if (!item) return
    setBusy(true)
    setError("")
    setResult(null)
    try {
      const response = await fetch(`${API_URL}/api/analytics/margin/scenario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_sucursal: item.id_sucursal,
          id_producto: item.id_producto,
          price_change: change,
          elasticity,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error)
      setResult(payload)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error de conexión")
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Simulador de margen bajo supuestos</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Cuando los precios históricos no permiten estimar una respuesta fiable,
        puedes comparar escenarios declarando tu propia elasticidad. No se
        modifica ningún precio.
      </p>
      <div className="my-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm">
          Producto de esta página
          <select
            className="mt-2 h-9 w-full rounded-md border bg-background px-2"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value)
              setResult(null)
            }}
          >
            <option value="">Seleccionar…</option>
            {rows.map((r) => (
              <option
                key={`${r.id_sucursal}:${r.id_producto}`}
                value={`${r.id_sucursal}:${r.id_producto}`}
              >
                {r.sucursal} · {r.producto}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Cambio de precio · {Math.round(change * 100)}%
          <Input
            className="mt-3"
            type="range"
            min="-0.1"
            max="0.1"
            step="0.01"
            value={change}
            onChange={(e) => {
              setChange(Number(e.target.value))
              setResult(null)
            }}
          />
        </label>
        <label className="text-sm">
          Elasticidad supuesta · {elasticity.toFixed(1)}
          <Input
            className="mt-3"
            type="range"
            min="-5"
            max="0"
            step="0.1"
            value={elasticity}
            onChange={(e) => {
              setElasticity(Number(e.target.value))
              setResult(null)
            }}
          />
        </label>
      </div>
      <Button disabled={!item || busy} onClick={simulate}>
        {busy ? "Calculando…" : "Comparar escenario"}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {result && item && (
        <div className="mt-5 grid gap-4 rounded-lg bg-muted/30 p-5 sm:grid-cols-4">
          {[
            ["Precio", result.price, "money"],
            ["Unidades semanales", result.units, "number"],
            ["Contribución estimada", result.contribution, "money"],
            [
              "Diferencia",
              result.contribution - result.contribution_base,
              "money",
            ],
          ].map(([label, value, unit]) => (
            <div key={String(label)}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-semibold">
                {format(value, String(unit))}
              </p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground sm:col-span-4">
            {result.limitations}
          </p>
        </div>
      )}
    </section>
  )
}
