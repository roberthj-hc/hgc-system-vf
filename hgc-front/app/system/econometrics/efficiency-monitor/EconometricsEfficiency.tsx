"use client";
import { useReport } from "@/lib/analytics/use-report";
import { ReportShell } from "@/components/analytics/report-shell";
import { ReportChart } from "@/components/analytics/report-chart";
import { ReportTable } from "@/components/analytics/report-table";
export function EconometricsEfficiency() {
  const state=useReport("efficiency");
  return <ReportShell state={state}>{state.data && <>
    <ReportChart title="Costo observado frente a referencia · último mes completo" data={state.data.series} kind="bar" measures={[{key:"costo_op_total",label:"Costo observado"},{key:"costo_esperado",label:"Costo de referencia"}]}/>
    <ReportTable data={state.data} onPage={state.setPage} columns={[{key:"sucursal",label:"Sucursal"},{key:"n_pedidos",label:"Pedidos"},{key:"costo_op_total",label:"Costo observado",unit:"money"},{key:"costo_esperado",label:"Referencia",unit:"money"},{key:"desviacion_costo",label:"Desviación",unit:"money"},{key:"estado",label:"Evaluación"}]}/>
  </>}</ReportShell>;
}
