"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/config";
import { formatMoney } from "@/lib/format";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = {
  FECHA_INICIO_SEMANA: string;
  SEMANA_ANIO: number;
  SUCURSAL: string;
  CIUDAD: string;
  INGRESOS_SEMANA: number;
  TICKET_PROMEDIO_SEMANA: number;
};

export function TimeSeriesMirror() {
  const [data, setData] = useState<Row[]>([]);

  // =========================
  // FILTERS
  // =========================
  const [ciudad, setCiudad] = useState("ALL");
  const [sucursal, setSucursal] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/time-series`);
        const json = await res.json();

        const clean = json.map((d: any) => ({
          ...d,
          INGRESOS_SEMANA: Number(d.INGRESOS_SEMANA) || 0,
          TICKET_PROMEDIO_SEMANA: Number(d.TICKET_PROMEDIO_SEMANA) || 0,
        }));

        setData(clean);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }
    load();
  }, []);

  // =========================
  // FILTERED DATA
  // =========================
  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchCiudad = ciudad === "ALL" || d.CIUDAD === ciudad;
      const matchSucursal = sucursal === "ALL" || d.SUCURSAL === sucursal;

      const date = new Date(d.FECHA_INICIO_SEMANA);
      const matchFrom = !from || date >= new Date(from);
      const matchTo = !to || date <= new Date(to);

      return matchCiudad && matchSucursal && matchFrom && matchTo;
    });
  }, [data, ciudad, sucursal, from, to]);

  // =========================
  // UNIQUE VALUES
  // =========================
  const ciudades = useMemo(() => Array.from(new Set(data.map((d) => d.CIUDAD))), [data]);
  const sucursales = useMemo(() => Array.from(new Set(data.map((d) => d.SUCURSAL))), [data]);

  // =========================
  // AGGREGATED CHART DATA (Group by Week)
  // =========================
  const aggregatedData = useMemo(() => {
    const groups: Record<string, { label: string; ingresos: number; ticketAcum: number; count: number; rawDate: number }> = {};

    filtered.forEach((d) => {
      const key = d.FECHA_INICIO_SEMANA; // Usamos la fecha como clave única de tiempo
      if (!groups[key]) {
        groups[key] = {
          label: `S${d.SEMANA_ANIO}`,
          ingresos: 0,
          ticketAcum: 0,
          count: 0,
          rawDate: new Date(key).getTime(),
        };
      }
      groups[key].ingresos += d.INGRESOS_SEMANA;
      groups[key].ticketAcum += d.TICKET_PROMEDIO_SEMANA;
      groups[key].count += 1;
    });

    // Convertimos a array, ordenamos por fecha y calculamos promedios si es necesario
    return Object.values(groups)
      .sort((a, b) => a.rawDate - b.rawDate)
      .map((g) => ({
        label: g.label,
        INGRESOS_SEMANA: g.ingresos,
        TICKET_PROMEDIO: g.ticketAcum / g.count, // Promedio de las sucursales en esa semana
      }));
  }, [filtered]);

  // =========================
  // SMOOTH SERIES
  // =========================
  const smooth = useMemo(() => {
    return aggregatedData.map((d, i, arr) => {
      const prev = arr[i - 1]?.INGRESOS_SEMANA ?? d.INGRESOS_SEMANA;
      const next = arr[i + 1]?.INGRESOS_SEMANA ?? d.INGRESOS_SEMANA;

      return {
        ...d,
        INGRESOS_SMOOTH: (prev + d.INGRESOS_SEMANA + next) / 3,
      };
    });
  }, [aggregatedData]);

  // =========================
  // TOP SUCURSALES
  // =========================
  const top = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((d) => {
      map[d.SUCURSAL] = (map[d.SUCURSAL] || 0) + d.INGRESOS_SEMANA;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  // =========================
  // KPIs (Calculados sobre el filtrado total)
  // =========================
  const totalIngresos = useMemo(() => filtered.reduce((a, b) => a + b.INGRESOS_SEMANA, 0), [filtered]);
  const promedioTicket = useMemo(() => 
    filtered.length ? filtered.reduce((a, b) => a + b.TICKET_PROMEDIO_SEMANA, 0) / filtered.length : 0
  , [filtered]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard Descriptivo — Análisis Semanal</h1>
        <div className="flex gap-2 flex-wrap">
          <Select value={ciudad} onValueChange={setCiudad}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ciudad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {ciudades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sucursal} onValueChange={setSucursal}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sucursal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {sucursales.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <input type="date" className="border rounded px-2" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="border rounded px-2" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Ingresos</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(totalIngresos)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ticket promedio</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(promedioTicket)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Registros</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{filtered.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tendencia de ingresos</CardTitle></CardHeader>
        <CardContent className="h-[380px]">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={smooth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={formatMoney} />
              <Tooltip formatter={(val: number) => formatMoney(val)} />
              <Line type="monotone" dataKey="INGRESOS_SMOOTH" stroke="#6366f1" dot={false} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top sucursales</CardTitle></CardHeader>
        <CardContent className="h-[380px]">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatMoney} />
              <Tooltip formatter={(val: number) => formatMoney(val)} />
              <Bar dataKey="value" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}