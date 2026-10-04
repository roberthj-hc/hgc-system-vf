"use client";
import { useReport } from "@/lib/analytics/use-report";
import { ReportShell } from "@/components/analytics/report-shell";
import { ReportChart } from "@/components/analytics/report-chart";
import { ReportTable } from "@/components/analytics/report-table";
export function TimeSeriesProfit() {
  const state=useReport("profit");
  return <ReportShell state={state}>{state.data && <>
    <ReportChart title="Rentabilidad operativa por mes" data={state.data.series} measures={[{key:"ingresos_netos",label:"Ingresos"},{key:"costo_op_total",label:"Costos operativos"},{key:"utilidad",label:"Utilidad operativa"}]}/>
    <ReportTable data={state.data} onPage={state.setPage} columns={[{key:"mes_fecha",label:"Mes",unit:"date"},{key:"sucursal",label:"Sucursal"},{key:"ingresos_netos",label:"Ingresos",unit:"money"},{key:"costo_op_total",label:"Costo operativo",unit:"money"},{key:"utilidad",label:"Utilidad",unit:"money"},{key:"margen",label:"Margen",unit:"percent"}]}/>
  </>}</ReportShell>;
}
