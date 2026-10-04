"use client";
import "@/components/analytics/analytics.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Activity, Database, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
const paths:Record<string,string>={clv:"predictions/clv",churn:"predictions/churn",sales:"time-series/mirror",profit:"time-series/profit",expansion:"time-series/simulator",margin:"econometrics/price-optimizer",efficiency:"econometrics/efficiency-monitor"};
type Entry={module:string;title:string;algorithm:string|null;cutoff:string|null;release_id:string;published_at:string};
export default function Page() {
  const {token,user}=useAuth();
  const [modules,setModules]=useState<Entry[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    if(!token) return;
    const controller=new AbortController();
    fetch(`${API_URL}/api/analytics/overview`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal})
      .then(async response=>{const data=await response.json();if(!response.ok) throw new Error(data.error);return data;})
      .then(data=>{setModules(data.modules);setError("");})
      .catch(cause=>{if(!controller.signal.aborted)setError(cause.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[token,refresh]);
  return <div data-analytics className="space-y-8 px-4 py-8 md:px-8">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Hermanos Golden Chicken</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">El negocio, con perspectiva.</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Hola, {user?.nombre}. Consulta resultados operativos, anticipa la demanda y compara escenarios con la última publicación validada.</p></div><Button variant="outline" size="sm" onClick={()=>{setLoading(true);setRefresh(v=>v+1);}}><RefreshCw className={loading?"animate-spin":""}/>Actualizar</Button></div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-card p-5"><Activity className="size-5 text-primary"/><p className="mt-4 text-3xl font-semibold">{modules.length}</p><p className="text-sm text-muted-foreground">Análisis disponibles para tu cargo</p></div><div className="rounded-xl border bg-card p-5"><Database className="size-5 text-primary"/><p className="mt-4 font-medium">PostgreSQL · serving</p><p className="mt-1 text-sm text-muted-foreground">Resultados materializados desde Snowflake</p></div><div className="rounded-xl border bg-card p-5"><p className="text-xs text-muted-foreground">Última publicación</p><p className="mt-3 font-medium">{modules[0] ? new Date(modules[0].published_at).toLocaleString("es-BO") : "Sin publicación disponible"}</p><p className="mt-2 text-xs text-muted-foreground">La fecha de los datos se muestra en cada análisis.</p></div></div>
    {error && <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
    {!loading && !error && !modules.length && <p className="rounded-xl border p-6 text-sm text-muted-foreground">No hay análisis publicados para tu cargo. Los resultados aparecerán después de completar la carga y el entrenamiento.</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map(item=><Link key={item.module} href={`/system/${paths[item.module]}`} className="group rounded-xl border bg-card p-6 transition hover:border-primary/50 hover:shadow-sm"><div className="flex justify-between"><h2 className="font-semibold">{item.title}</h2><ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary"/></div><p className="mt-3 text-sm text-muted-foreground">{item.algorithm || "Indicadores operativos de los datos registrados"}</p><p className="mt-6 text-xs text-muted-foreground">Datos hasta {item.cutoff || "la fecha de corte de la carga"}</p></Link>)}</div>
  </div>;
}
