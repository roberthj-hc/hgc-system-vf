"use client";
import { useReport } from "@/lib/analytics/use-report";
import { ReportShell } from "./report-shell";
import { ReportChart } from "./report-chart";
import { ReportTable } from "./report-table";
export function CustomerReport({mode}:{mode:"clv"|"churn"}) {
  const state=useReport(mode);
  const population=state.data?.model?.algorithm.includes("validado") || state.data?.model?.algorithm.includes("validada");
  return <ReportShell state={state}>{state.data && <>
    {population && <div className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-4 text-sm">Las variables disponibles no superaron la referencia poblacional. Se muestra una estimación común; estos resultados no permiten priorizar clientes por riesgo o valor individual.</div>}
    <ReportChart title={population ? "Estimación poblacional · muestra de clientes" : mode==="clv" ? "Clientes con mayor ingreso esperado" : "Clientes con mayor riesgo de inactividad"} data={state.data.series} kind="bar" unit={mode==="clv"?"money":"percent"} measures={[{key:mode,label:mode==="clv"?"Ingreso esperado · 90 días":"Riesgo de inactividad"}]}/>
    <ReportTable data={state.data} onPage={state.setPage} columns={[
      {key:"id_cliente",label:"Cliente"},{key:"id_sucursal",label:"Última sucursal"},
      {key:"dias_sin_compra",label:"Días sin compra"},{key:"pedidos_180d",label:"Pedidos · 180 días"},
      {key:"gasto_180d",label:"Ingreso histórico",unit:"money"},{key:"clv",label:"Ingreso esperado · 90 días",unit:"money"},
      {key:"churn",label:"Riesgo · 90 días",unit:"percent"},{key:"segmento",label:"Prioridad"}]}/>
  </>}</ReportShell>;
}
