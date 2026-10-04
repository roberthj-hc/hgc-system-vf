"use client";
import "./analytics.css";
import type { ReactNode } from "react";
import { RefreshCw, Database, ShieldCheck, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "@/lib/analytics/types";
import { useReport } from "@/lib/analytics/use-report";

export function ReportShell({state,children}:{state:ReturnType<typeof useReport>;children:ReactNode}) {
  const {data,error,loading}=state;
  const cutoff=data?.model?.cutoff || data?.cutoff;
  const stale=cutoff && new Date(data!.evaluated_at).getTime()-new Date(cutoff).getTime()>45*86400000;
  return <div data-analytics className="space-y-6" aria-busy={loading}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-700 dark:text-amber-400">HGC · Inteligencia de negocio</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data?.title || "Análisis del negocio"}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{data?.description || "Consultando la última publicación validada…"}</p></div>
      <Button variant="outline" size="sm" onClick={state.retry} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Actualizar</Button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 text-sm">{error}<Button className="ml-3" variant="outline" onClick={state.retry}>Reintentar</Button></div>}
    {!data && loading && <div role="status" className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-28 animate-pulse rounded-xl bg-muted"/>)}</div>}
    {data && <>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Badge variant="secondary"><ShieldCheck className="mr-1 size-3"/>Publicación validada</Badge>
        {cutoff && <span className="flex items-center gap-1"><Clock3 className="size-3"/>Datos hasta {cutoff}</span>}
        <span className="flex items-center gap-1"><Database className="size-3"/>Actualizado {new Date(data.published_at).toLocaleString("es-BO")}</span>
      </div>
      {stale && <div className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm">El histórico tiene más de 45 días de antigüedad. Las proyecciones parten de su fecha de corte; no representan el período actual.</div>}
      <div className="grid gap-4 sm:grid-cols-3">{data.kpis.map(k=><Card key={k.label} className="border-border/70 shadow-sm"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{k.label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{format(k.value,k.unit)}</p></CardContent></Card>)}</div>
      <p className="-mt-3 text-xs text-muted-foreground">{data.kpi_scope}</p>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <label className="flex items-center gap-2 text-sm">Sucursal<select aria-label="Sucursal" className="h-9 max-w-64 rounded-md border bg-background px-3" value={state.branch} onChange={e=>state.setBranch(e.target.value)}><option value="all">Todas las sucursales</option>{data.branches.map(b=><option key={b.id_sucursal} value={b.id_sucursal}>{b.sucursal}</option>)}</select></label>
        <Input aria-label="Buscar en resultados" className="max-w-xs" placeholder="Buscar cliente, producto o estado…" value={state.search} onChange={e=>state.setSearch(e.target.value)}/>
        {loading && <span role="status" className="text-xs text-muted-foreground">Actualizando filtros…</span>}
      </div>
      <div className={loading ? "space-y-6 opacity-60" : "space-y-6"}>{children}</div>
      <div className="rounded-xl border bg-muted/20 p-5 text-sm">
        <h2 className="font-semibold">Calidad y alcance del análisis</h2>
        <p className="mt-2 text-muted-foreground">{[data.limitations, data.model?.limitations].filter(Boolean).join(" ")}</p>
        {data.model && <p className="mt-2 text-muted-foreground">Modelo: {data.model.algorithm}. Validación: {data.model.validation}.</p>}
        <details className="mt-3"><summary className="cursor-pointer text-xs font-medium">Ver trazabilidad y métricas</summary>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div><dt>Publicación</dt><dd className="font-mono break-all">{data.release_id}</dd></div><div><dt>Carga de datos</dt><dd className="font-mono break-all">{data.load_id}</dd></div>
          {data.model && <div><dt>Run de MLflow</dt><dd className="font-mono break-all">{data.model.run_id}</dd></div>}
          {Object.entries(data.model?.metrics || {}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{format(value)}</dd></div>)}</dl>
          <p className="mt-3 text-xs">Filas validadas: {data.quality.map(q=>`${q.table}: ${format(q.rows)}`).join(" · ")}</p>
        </details>
      </div>
    </>}
  </div>;
}
