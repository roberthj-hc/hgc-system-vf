"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// =========================
// TIPOS DEFINIDOS
// =========================
type DescriptiveRow = {
  FECHA_INICIO_SEMANA: string;
  ANIO: number;
  SEMANA_ANIO: number;
  SUCURSAL: string;
  CIUDAD: string;
  TIPO_FORMATO: string;
  INGRESOS_SEMANA: number;
  PEDIDOS_SEMANA: number;
  TICKET_PROMEDIO_SEMANA: number;
  UNIDADES_SEMANA: number;
  PEDIDOS_MISMA_SEMANA_ANIO_ANTERIOR: number;
  VARIACION_YOY_PCT: number;
  PEDIDOS_EN_FERIADO: number;
  PEDIDOS_FIN_SEMANA: number;
  PEDIDOS_DIAS_LABORALES: number;
};

const formatMoney = (v: any) => 
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(Number(v) || 0);

const formatPct = (v: any) => `${(Number(v) || 0).toFixed(1)}%`;

export function TimeSeriesMirror() {
  const [data, setData] = useState<DescriptiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Filtros
  const [selectedCiudad, setSelectedCiudad] = useState("ALL");

  useEffect(() => {
    setIsMounted(true);
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/time-series/description`);
        const json = await res.json();
        
        if (Array.isArray(json)) {
          const clean: DescriptiveRow[] = json.map((d: any) => {
            const getVal = (key: string) => d[key] ?? d[key.toLowerCase()] ?? d[key.toUpperCase()];
            
            // Mapeo completo para cumplir con el tipo DescriptiveRow y evitar errores de TS
            return {
              FECHA_INICIO_SEMANA: String(getVal("FECHA_INICIO_SEMANA") || ""),
              ANIO: Number(getVal("ANIO")) || 0,
              SEMANA_ANIO: Number(getVal("SEMANA_ANIO")) || 0,
              SUCURSAL: String(getVal("SUCURSAL") || "S/N"),
              CIUDAD: String(getVal("CIUDAD") || "S/C"),
              TIPO_FORMATO: String(getVal("TIPO_FORMATO") || "N/A"),
              INGRESOS_SEMANA: Number(getVal("INGRESOS_SEMANA")) || 0,
              PEDIDOS_SEMANA: Number(getVal("PEDIDOS_SEMANA")) || 0,
              TICKET_PROMEDIO_SEMANA: Number(getVal("TICKET_PROMEDIO_SEMANA")) || 0,
              UNIDADES_SEMANA: Number(getVal("UNIDADES_SEMANA")) || 0,
              PEDIDOS_MISMA_SEMANA_ANIO_ANTERIOR: Number(getVal("PEDIDOS_MISMA_SEMANA_ANIO_ANTERIOR")) || 0,
              VARIACION_YOY_PCT: Number(getVal("VARIACION_YOY_PCT")) || 0,
              PEDIDOS_EN_FERIADO: Number(getVal("PEDIDOS_EN_FERIADO")) || 0,
              PEDIDOS_FIN_SEMANA: Number(getVal("PEDIDOS_FIN_SEMANA")) || 0,
              PEDIDOS_DIAS_LABORALES: Number(getVal("PEDIDOS_DIAS_LABORALES")) || 0,
            };
          });
          setData(clean);
        }
      } catch (e) {
        console.error("Error loading descriptive data", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // =========================
  // TRANSFORMACIONES
  // =========================
  
  const filteredData = useMemo(() => 
    data.filter(d => selectedCiudad === "ALL" || d.CIUDAD === selectedCiudad), 
  [data, selectedCiudad]);

  const ciudades = useMemo(() => Array.from(new Set(data.map(d => d.CIUDAD))).filter(Boolean), [data]);

  // 1. Serie Temporal: Ingresos por Sucursal (Líneas superpuestas)
  const timeSeriesData = useMemo(() => {
    const groups = new Map();
    filteredData.forEach(d => {
      const fecha = d.FECHA_INICIO_SEMANA.split('T')[0];
      if (!groups.has(fecha)) groups.set(fecha, { date: fecha });
      const entry = groups.get(fecha);
      entry[d.SUCURSAL] = d.INGRESOS_SEMANA;
    });
    return Array.from(groups.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData]);

  const sucursalesUnicas = useMemo(() => Array.from(new Set(filteredData.map(d => d.SUCURSAL))), [filteredData]);

  // 2. Heatmap/Distribución: Pedidos por tipo de jornada
  const heatmapData = useMemo(() => {
    const totals = { Laborales: 0, "Fin de Semana": 0, Feriados: 0 };
    filteredData.forEach(d => {
      totals.Laborales += d.PEDIDOS_DIAS_LABORALES;
      totals["Fin de Semana"] += d.PEDIDOS_FIN_SEMANA;
      totals.Feriados += d.PEDIDOS_EN_FERIADO;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // 3. Comparativa YoY Semanal Agrupada
  const yoyData = useMemo(() => {
    const weeklyMap = new Map<number, { totalYoy: number; count: number }>();
    
    filteredData.forEach(d => {
      if (!weeklyMap.has(d.SEMANA_ANIO)) weeklyMap.set(d.SEMANA_ANIO, { totalYoy: 0, count: 0 });
      const week = weeklyMap.get(d.SEMANA_ANIO)!;
      week.totalYoy += d.VARIACION_YOY_PCT;
      week.count += 1;
    });

    return Array.from(weeklyMap.entries())
      .map(([semana, stats]) => ({
        semana: `S${semana}`,
        yoy: stats.totalYoy / stats.count
      }))
      .sort((a, b) => parseInt(a.semana.slice(1)) - parseInt(b.semana.slice(1)))
      .slice(-12);
  }, [filteredData]);

  // 4. RANKING CORREGIDO: Promedio por Sucursal
  const rankingData = useMemo(() => {
    const stats = new Map<string, { totalTicket: number; count: number; ciudad: string }>();

    filteredData.forEach((d) => {
      if (!stats.has(d.SUCURSAL)) {
        stats.set(d.SUCURSAL, { totalTicket: 0, count: 0, ciudad: d.CIUDAD });
      }
      const curr = stats.get(d.SUCURSAL)!;
      curr.totalTicket += d.TICKET_PROMEDIO_SEMANA;
      curr.count += 1;
    });

    return Array.from(stats.entries())
      .map(([sucursal, info]) => ({
        sucursal,
        ciudad: info.ciudad,
        ticketPromedio: info.totalTicket / info.count,
      }))
      .sort((a, b) => b.ticketPromedio - a.ticketPromedio)
      .slice(0, 6);
  }, [filteredData]);

  if (!isMounted || loading) return <div className="h-screen flex items-center justify-center">Cargando Dashboard Descriptivo...</div>;

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis Descriptivo</h1>
          <p className="text-muted-foreground">Métricas históricas y rendimiento por punto de venta.</p>
        </div>
        <Select value={selectedCiudad} onValueChange={setSelectedCiudad}>
          <SelectTrigger className="w-[200px] bg-white border-slate-200 shadow-sm">
            <SelectValue placeholder="Filtrar por Ciudad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las Ciudades</SelectItem>
            {ciudades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Serie Temporal */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Ingresos Semanales por Sucursal</CardTitle>
            <CardDescription>Evolución de ventas netas (Bs.)</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `Bs.${v/1000}k`} />
                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {sucursalesUnicas.map((suc, i) => (
                  <Line
                    key={suc}
                    type="monotone"
                    dataKey={suc}
                    stroke={`hsl(${i * 60}, 70%, 45%)`}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de Demanda */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Distribución de Demanda</CardTitle>
            <CardDescription>Pedidos totales por jornada</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={12} width={100} stroke="#64748b" />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={45}>
                  {heatmapData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#f43f5e'][index % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Crecimiento YoY */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Crecimiento YoY %</CardTitle>
            <CardDescription>Variación vs año anterior (Promedio Red)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="semana" fontSize={11} />
                <YAxis fontSize={11} unit="%" />
                <Tooltip formatter={(v) => formatPct(v)} contentStyle={{ borderRadius: '8px' }} />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                <Bar dataKey="yoy">
                  {yoyData.map((entry, index) => (
                    <Cell key={index} fill={entry.yoy >= 0 ? "#10b981" : "#f43f5e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RANKING TICKET PROMEDIO CORREGIDO */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Ranking de Ticket Promedio</CardTitle>
            <CardDescription>Eficiencia de venta promedio por sucursal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rankingData.map((item, i) => (
                <div key={item.sucursal} className="flex items-center justify-between p-4 border rounded-xl bg-white">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 font-bold text-sm border border-blue-100">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-none mb-1">{item.sucursal}</p>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">{item.ciudad}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900">{formatMoney(item.ticketPromedio)}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Promedio</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}