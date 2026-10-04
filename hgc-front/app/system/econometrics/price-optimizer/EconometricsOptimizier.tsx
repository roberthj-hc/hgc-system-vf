"use client";
import { MarginScenario } from "@/components/analytics/margin-scenario";
import { useReport } from "@/lib/analytics/use-report";
import { ReportShell } from "@/components/analytics/report-shell";
import { ReportChart } from "@/components/analytics/report-chart";
import { ReportTable } from "@/components/analytics/report-table";
export function EconometricsOptimizier() {
  const state=useReport("margin");
  return <ReportShell state={state}>{state.data && <>
    <ReportChart title="Contribución semanal · escenarios observacionales" data={state.data.series} kind="bar" measures={[{key:"margen_actual",label:"Contribución actual"},{key:"margen_simulado",label:"Contribución simulada"}]}/>
    <MarginScenario key={`${state.branch}:${state.page}:${state.search}`} rows={state.data.rows}/>
    <ReportTable data={state.data} onPage={state.setPage} columns={[{key:"sucursal",label:"Sucursal"},{key:"producto",label:"Producto"},{key:"precio_actual",label:"Precio actual",unit:"money"},{key:"costo_unitario",label:"Costo estándar",unit:"money"},{key:"precio_sugerido",label:"Precio del escenario",unit:"money"},{key:"margen_simulado",label:"Contribución semanal",unit:"money"},{key:"estado",label:"Soporte de datos"}]}/>
  </>}</ReportShell>;
}
