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
    BarChart,
    Bar,
    CartesianGrid,
    Legend,
    AreaChart,
    Area,
    ComposedChart,
    Scatter,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// =========================
// DEFINICIÓN DE TIPOS
// =========================
type Row = {
    FECHA: string;
    ID_SUCURSAL: number;
    SUCURSAL: string;
    CIUDAD: string;
    CANAL_VENTA: string;
    DIA_SEMANA: string;
    MES: number;
    ANIO: number;
    ES_FERIADO: boolean;
    ES_FIN_SEMANA: boolean;
    DURANTE_CAMPANA: boolean;
    NUM_PEDIDOS: number;
    INGRESOS_NETOS: number;
    TICKET_PROMEDIO: number;
    TOTAL_UNIDADES_VENDIDAS: number;
    MEDIA_MOVIL_28D: number;
    STDDEV_MOVIL_28D: number;
    TIPO_ANOMALIA: string | null;
    DESVIACION_VS_MEDIA: number;
    DESVIACION_PCT: number;
};

const formatMoney = (value: any) => {
    const num = Number(value);
    if (isNaN(num)) return "Bs. 0.00";
    return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(num);
};

export function TimeSeriesProfit() {
    const [data, setData] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const [ciudad, setCiudad] = useState("ALL");
    const [sucursal, setSucursal] = useState("ALL");

    // =========================
    // CARGA Y NORMALIZACIÓN
    // =========================
    useEffect(() => {
        setIsMounted(true);
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/time-series/diagnostic`);
                const json = await res.json();

                if (Array.isArray(json)) {
                    const clean = json.map((d: any) => {
                        const getVal = (key: string) => d[key] ?? d[key.toLowerCase()] ?? d[key.toUpperCase()];
                        return {
                            FECHA: String(getVal("FECHA") || ""),
                            ID_SUCURSAL: Number(getVal("ID_SUCURSAL")),
                            SUCURSAL: String(getVal("SUCURSAL") || "S/N"),
                            CIUDAD: String(getVal("CIUDAD") || "S/C"),
                            CANAL_VENTA: String(getVal("CANAL_VENTA") || "Otros"),
                            DIA_SEMANA: String(getVal("DIA_SEMANA") || ""),
                            ES_FERIADO: String(getVal("ES_FERIADO")) === 'true' || getVal("ES_FERIADO") === true,
                            DURANTE_CAMPANA: String(getVal("DURANTE_CAMPANA")) === 'true' || getVal("DURANTE_CAMPANA") === true,
                            INGRESOS_NETOS: Number(getVal("INGRESOS_NETOS")) || 0,
                            MEDIA_MOVIL_28D: Number(getVal("MEDIA_MOVIL_28D")) || 0,
                            TIPO_ANOMALIA: getVal("TIPO_ANOMALIA") || null,
                        } as Row;
                    });
                    setData(clean);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // =========================
    // TRANSFORMACIONES (MEMOS)
    // =========================
    const filteredData = useMemo(() => {
        return data.filter((d) => {
            if (ciudad !== "ALL" && d.CIUDAD !== ciudad) return false;
            if (sucursal !== "ALL" && d.SUCURSAL !== sucursal) return false;
            return true;
        });
    }, [data, ciudad, sucursal]);

    const ciudades = useMemo(() => Array.from(new Set(data.map((d) => d.CIUDAD))).filter(Boolean), [data]);
    const sucursales = useMemo(() => {
        return Array.from(new Set(
            data.filter(d => ciudad === "ALL" || d.CIUDAD === ciudad).map((d) => d.SUCURSAL)
        )).filter(Boolean);
    }, [data, ciudad]);

    // Gráfico 1: Tendencia
    const trendData = useMemo(() => {
        const map = new Map();
        filteredData.forEach((d) => {
            if (!map.has(d.FECHA)) map.set(d.FECHA, { FECHA: d.FECHA, INGRESOS_NETOS: 0, MEDIA_MOVIL_28D: d.MEDIA_MOVIL_28D });
            const existing = map.get(d.FECHA);
            existing.INGRESOS_NETOS += d.INGRESOS_NETOS;
        });
        return Array.from(map.values()).sort((a, b) => new Date(a.FECHA).getTime() - new Date(b.FECHA).getTime());
    }, [filteredData]);

    // Gráfico 2: Feriados
    const holidayData = useMemo(() => {
        let fSum = 0, fCount = 0, nSum = 0, nCount = 0;
        filteredData.forEach((d) => {
            if (d.ES_FERIADO) { fSum += d.INGRESOS_NETOS; fCount++; }
            else { nSum += d.INGRESOS_NETOS; nCount++; }
        });
        return [
            { id: "normal", tipo: "Día Normal", promedio: nCount ? nSum / nCount : 0 },
            { id: "feriado", tipo: "Feriado", promedio: fCount ? fSum / fCount : 0 },
        ];
    }, [filteredData]);

    // Gráfico 3: Anomalías y Campañas
    const anomalyCampaignData = useMemo(() => {
        const map = new Map();
        filteredData.forEach((d) => {
            if (!map.has(d.FECHA)) {
                map.set(d.FECHA, { FECHA: d.FECHA, INGRESOS_NETOS: 0, DURANTE_CAMPANA: d.DURANTE_CAMPANA ? 1 : 0, ANOMALIA_VAL: null });
            }
            const existing = map.get(d.FECHA);
            existing.INGRESOS_NETOS += d.INGRESOS_NETOS;
            if (d.TIPO_ANOMALIA) existing.ANOMALIA_VAL = existing.INGRESOS_NETOS;
        });
        return Array.from(map.values()).sort((a, b) => new Date(a.FECHA).getTime() - new Date(b.FECHA).getTime());
    }, [filteredData]);

    // Gráfico 4: Canales
    const channelsData = useMemo(() => {
        const map = new Map();
        const channels = new Set<string>();
        filteredData.forEach((d) => {
            if (!map.has(d.FECHA)) map.set(d.FECHA, { FECHA: d.FECHA });
            const existing = map.get(d.FECHA);
            const canal = d.CANAL_VENTA || "Otro";
            channels.add(canal);
            existing[canal] = (existing[canal] || 0) + d.INGRESOS_NETOS;
        });
        return { data: Array.from(map.values()).sort((a, b) => new Date(a.FECHA).getTime() - new Date(b.FECHA).getTime()), keys: Array.from(channels) };
    }, [filteredData]);

    const channelColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    if (!isMounted || loading) {
        return <div className="p-8 text-center text-muted-foreground h-[400px] flex items-center justify-center">Cargando diagnóstico...</div>;
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard de Diagnóstico</h2>
                    <p className="text-muted-foreground">Análisis de tendencias y anomalías en base a PostgreSQL.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={ciudad} onValueChange={setCiudad}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Ciudad" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem key="c-all" value="ALL">Todas las Ciudades</SelectItem>
                            {ciudades.map(c => <SelectItem key={`c-${c}`} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={sucursal} onValueChange={setSucursal}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sucursal" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem key="s-all" value="ALL">Todas las Sucursales</SelectItem>
                            {sucursales.map(s => <SelectItem key={`s-${s}`} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* G1: TENDENCIA */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Descomposición: Tendencia vs Actualidad</CardTitle>
                        <CardDescription>Ingresos reales frente a la media móvil de 28 días.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="FECHA" fontSize={12} />
                                <YAxis tickFormatter={(v) => `Bs.${v / 1000}k`} fontSize={12} />
                                <Tooltip formatter={(value) => [formatMoney(value), "Monto"]} />
                                <Legend />
                                <Line type="monotone" dataKey="INGRESOS_NETOS" name="Real" stroke="#2563eb" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="MEDIA_MOVIL_28D" name="Tendencia" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* G2: FERIADOS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Impacto de Feriados</CardTitle>
                        <CardDescription>Promedio de ingresos días normales vs feriados.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={holidayData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="tipo" />
                                <YAxis tickFormatter={(v) => `Bs.${v / 1000}k`} />
                                <Tooltip formatter={(value) => [formatMoney(value), "Promedio"]} />
                                <Bar dataKey="promedio" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={80} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* G3: ANOMALÍAS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Anomalías y Campañas Activas</CardTitle>
                        <CardDescription>Puntos rojos indican anomalías detectadas.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={anomalyCampaignData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="FECHA" fontSize={12} />
                                <YAxis tickFormatter={(v) => `Bs.${v / 1000}k`} fontSize={12} />
                                <Tooltip formatter={(value) => [formatMoney(value), "Valor"]} />
                                <Legend />
                                <Area type="step" dataKey="DURANTE_CAMPANA" name="Campaña" fill="#fef08a" stroke="none" fillOpacity={0.4} />
                                <Line type="monotone" dataKey="INGRESOS_NETOS" name="Ingresos" stroke="#2563eb" dot={false} />
                                <Scatter dataKey="ANOMALIA_VAL" name="Anomalía" fill="#ef4444" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* G4: CANALES */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Evolución de Canales</CardTitle>
                        <CardDescription>Mix de ventas por canal a lo largo del tiempo.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={channelsData.data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="FECHA" fontSize={12} />
                                <YAxis tickFormatter={(v) => `Bs.${v / 1000}k`} fontSize={12} />
                                <Tooltip formatter={(value) => [formatMoney(value), "Monto"]} />
                                <Legend />
                                {channelsData.keys.map((key, i) => (
                                    <Area
                                        key={`ch-${key}`}
                                        type="monotone"
                                        dataKey={key}
                                        stackId="1"
                                        stroke={channelColors[i % 5]}
                                        fill={channelColors[i % 5]}
                                        fillOpacity={0.6}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}