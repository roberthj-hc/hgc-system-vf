"use client";
import { useReport } from "@/lib/analytics/use-report";
import { ReportShell } from "@/components/analytics/report-shell";
import { ReportChart } from "@/components/analytics/report-chart";
import { ReportTable } from "@/components/analytics/report-table";
export function TimeSeriesMirror() {
  const state=useReport("sales");
  return <ReportShell state={state}>{state.data && <>
    <ReportChart title="Ingresos semanales observados · último año" data={state.data.series} measures={[{key:"ingresos",label:"Ingresos"}]}/>
    <ReportChart title="Proyección diaria · 12 semanas desde la fecha de corte" data={state.data.forecast} measures={[{key:"ingresos",label:"Ingresos esperados"}]}/>
    <ReportTable data={state.data} onPage={state.setPage} columns={[{key:"semana",label:"Inicio de semana"},{key:"sucursal",label:"Sucursal"},{key:"ingresos",label:"Ingresos",unit:"money"},{key:"pedidos",label:"Pedidos"}]}/>
  </>}</ReportShell>;
}
