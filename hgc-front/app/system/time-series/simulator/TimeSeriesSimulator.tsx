"use client";
import { useState } from "react";
import { useReport } from "@/lib/analytics/use-report";
import { useAuth } from "@/lib/auth-context";
import { API_URL } from "@/lib/config";
import { format } from "@/lib/analytics/types";
import { ReportShell } from "@/components/analytics/report-shell";
import { ReportTable } from "@/components/analytics/report-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Scenario={revenue:number;fixed_cost:number;variable_cost:number;profit:number;break_even:number|null;payback_months:number|null;limitations:string};
export function TimeSeriesSimulator() {
  const state=useReport("expansion");
  const {token}=useAuth();
  const [demand,setDemand]=useState(1);
  const [fixed,setFixed]=useState(1);
  const [investment,setInvestment]=useState(100000);
  const [scenario,setScenario]=useState<Scenario|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function simulate() {
    setBusy(true);setError("");setScenario(null);
    try {
      const response=await fetch(`${API_URL}/api/analytics/expansion/scenario`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({id_sucursal:Number(state.branch),demand_factor:demand,fixed_factor:fixed,investment})});
      const payload=await response.json();
      if(!response.ok) throw new Error(payload.error);
      setScenario(payload);
    } catch(cause) {setError(cause instanceof Error ? cause.message : "No se pudo simular");}
    finally {setBusy(false);}
  }
  return <ReportShell state={state}>{state.data && <>
    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Evalúa un escenario de apertura</h2><p className="mt-2 text-sm text-muted-foreground">Selecciona una sucursal comparable arriba. La demanda parte del modelo entrenado; los ajustes siguientes son supuestos de negocio.</p>
      <div className="my-5 grid gap-5 md:grid-cols-3">
        <label className="text-sm">Demanda respecto al comparable · {Math.round(demand*100)}%<Input className="mt-3" type="range" min="0.1" max="2" step="0.05" value={demand} onChange={e=>{setDemand(Number(e.target.value));setScenario(null);}}/></label>
        <label className="text-sm">Costo fijo respecto al comparable · {Math.round(fixed*100)}%<Input className="mt-3" type="range" min="0.5" max="3" step="0.05" value={fixed} onChange={e=>{setFixed(Number(e.target.value));setScenario(null);}}/></label>
        <label className="text-sm">Inversión inicial (Bs.)<Input className="mt-2" type="number" min="0" max="100000000" value={investment} onChange={e=>{setInvestment(Number(e.target.value));setScenario(null);}}/></label>
      </div><Button onClick={simulate} disabled={busy || state.branch==="all"}>{busy?"Calculando…":"Calcular escenario"}</Button>{state.branch==="all" && <span className="ml-3 text-xs text-muted-foreground">Elige una sucursal para continuar.</span>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {scenario && <div className="mt-5 grid gap-4 rounded-lg bg-muted/30 p-5 sm:grid-cols-3">{[
        ["Ingreso mensual",scenario.revenue,"money"],["Costo fijo",scenario.fixed_cost,"money"],["Costo variable",scenario.variable_cost,"money"],
        ["Utilidad mensual estimada",scenario.profit,"money"],["Venta de equilibrio",scenario.break_even,"money"],["Recuperación (meses)",scenario.payback_months,"number"]
      ].map(([label,value,unit])=><div key={String(label)}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{format(value,String(unit))}</p></div>)}
      {scenario.payback_months===null && <p className="text-sm text-destructive sm:col-span-3">El escenario no recupera la inversión con la utilidad estimada.</p>}</div>}
    </section>
    <ReportTable data={state.data} onPage={page=>{state.setPage(page);setScenario(null);}} columns={[{key:"sucursal",label:"Comparable"},{key:"ciudad",label:"Ciudad"},{key:"ingreso_mensual",label:"Ingreso mensual proyectado",unit:"money"},{key:"costo_fijo",label:"Costo fijo medio",unit:"money"},{key:"ratio_variable",label:"Costo variable / ingreso",unit:"percent"},{key:"margen_historico",label:"Margen histórico",unit:"percent"}]}/>
  </>}</ReportShell>;
}
