"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/config";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend, AreaChart, Area, BarChart, Bar, ReferenceLine, Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Zap, Database } from "lucide-react";

// Tipos corregidos para coincidir con la respuesta de la API
type PredictionPoint = {
    fecha: string;
    ingreso_predicho: number;
    pedidos_predichos: number;
    confianza_min: number;
    confianza_max: number;
};

const formatMoney = (v: any) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v);

const ML_API_URL = "http://localhost:8000";

export function TimeSeriesSimulator() {
    const [forecast, setForecast] = useState<PredictionPoint[]>([]);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState("modelo_predictivo_ventas");
    const [loading, setLoading] = useState(true);
    const [sucursal, setSucursal] = useState("1");
    const [semanas, setSemanas] = useState(6);
    const [campanaActiva, setCampanaActiva] = useState(false);
    const [capacidadMaxima, setCapacidadMaxima] = useState(500);

    // 1. Cargar lista de modelos disponibles
    useEffect(() => {
        async function getModels() {
            try {
                const res = await fetch(`${ML_API_URL}/api/models`);
                const data = await res.json();
                setAvailableModels(data.available_models);
                if (data.available_models.length > 0 && !selectedModel) {
                    setSelectedModel(data.available_models[0]);
                }
            } catch (e) {
                console.error("Error cargando modelos", e);
            }
        }
        getModels();
    }, []);

    // 2. Fetch de predicción (Corregido el mapeo de campos)
    useEffect(() => {
        async function fetchPrediction() {
            if (!selectedModel) return;
            setLoading(true);
            try {
                const res = await fetch(`${ML_API_URL}/api/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model_name: selectedModel,
                        num_semanas: semanas,
                        flag_campana: campanaActiva ? 1 : 0,
                        id_sucursal: parseInt(sucursal)
                    })
                });

                const json = await res.json();

                // Transformamos la respuesta de la API al formato que usan los gráficos
                // Busca esta parte dentro del useEffect de fetchPrediction
                const mappedData: PredictionPoint[] = json.predictions.map((p: any) => {
                    // Verificamos si los datos vienen como objetos anidados o valores simples
                    const ingresoVal = typeof p.ingresos === 'object' ? p.ingresos.pred : p.ingresos;
                    const pedidoVal = typeof p.pedidos === 'object' ? p.pedidos.pred : p.pedidos;

                    // Verificamos si existen los intervalos de confianza, si no, ponemos el mismo valor
                    const min = p.ingresos?.ic_95 ? p.ingresos.ic_95[0] : ingresoVal;
                    const max = p.ingresos?.ic_95 ? p.ingresos.ic_95[1] : ingresoVal;

                    return {
                        fecha: p.fecha,
                        ingreso_predicho: ingresoVal || 0,
                        pedidos_predichos: pedidoVal || 0,
                        confianza_min: min || 0,
                        confianza_max: max || 0
                    };
                });

                setForecast(mappedData);
            } catch (e) {
                console.error("Error al conectar con la API", e);
            } finally {
                setLoading(false);
            }
        }
        fetchPrediction();
    }, [sucursal, semanas, campanaActiva, selectedModel]);

    const alertas = useMemo(() => {
        return forecast.filter(p => p.pedidos_predichos > capacidadMaxima);
    }, [forecast, capacidadMaxima]);

    return (
        <div className="p-6 space-y-6 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard Predictivo</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        Smart-Supply: Medallion Architecture Models
                    </p>
                </div>

                <Card className="w-full md:w-auto border-blue-100 shadow-sm">
                    <CardContent className="pt-4 flex flex-wrap items-center gap-6">
                        {/* SELECTOR DE MODELO .PKL */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                                <Database className="w-3 h-3" /> Modelo PKL
                            </span>
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger className="w-48 bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    {availableModels.map(m => (
                                        <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Campaña</span>
                            <div className="flex items-center gap-2">
                                <Switch checked={campanaActiva} onCheckedChange={setCampanaActiva} />
                                <Badge variant={campanaActiva ? "default" : "outline"} className={campanaActiva ? "bg-blue-600" : ""}>
                                    {campanaActiva ? "Activa" : "Inactiva"}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-32">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Horizonte: {semanas} sem.</span>
                            <Slider value={[semanas]} min={4} max={12} step={1} onValueChange={(v) => setSemanas(v[0])} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Sucursal</span>
                            <Select value={sucursal} onValueChange={setSucursal}>
                                <SelectTrigger className="w-28 bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Zona Sur</SelectItem>
                                    <SelectItem value="2">El Alto</SelectItem>
                                    <SelectItem value="3">Centro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* GRÁFICO DE INGRESOS */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Proyección de Flujo de Caja (Bs.)</CardTitle>
                        <CardDescription>Predicción de ingresos diarios agregados por semana</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                Cargando inferencia...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecast}>
                                    <defs>
                                        <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="fecha" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(v) => `Bs.${v / 1000}k`} axisLine={false} tickLine={false} fontSize={11} />
                                    <Tooltip formatter={(v: any) => formatMoney(v)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="top" align="right" height={36} />
                                    <Area name="Confianza (95%)" type="monotone" dataKey="confianza_max" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
                                    <Area type="monotone" dataKey="confianza_min" stroke="none" fill="#3b82f6" fillOpacity={0.1} legendType="none" />
                                    <Area name="Ingreso Proyectado" type="monotone" dataKey="ingreso_predicho" stroke="#2563eb" strokeWidth={3} fill="url(#colorIngreso)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* GRÁFICO DE PEDIDOS */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Volumen de Pedidos</CardTitle>
                        <CardDescription>Demanda vs Capacidad Operativa</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={forecast}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="fecha" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} fontSize={11} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <ReferenceLine y={capacidadMaxima} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'right', value: 'Cap.', fill: '#ef4444', fontSize: 10 }} />
                                <Bar dataKey="pedidos_predichos" radius={[4, 4, 0, 0]}>
                                    {forecast.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pedidos_predichos > capacidadMaxima ? "#f87171" : "#34d399"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                    <CardContent className="pt-0">
                        <div className="p-3 bg-slate-50 rounded-lg space-y-3">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-500 uppercase">Capacidad Máxima</span>
                                <span className="text-slate-900">{capacidadMaxima} pedidos/día</span>
                            </div>
                            <Slider value={[capacidadMaxima]} min={100} max={1000} step={50} onValueChange={(v) => setCapacidadMaxima(v[0])} />
                        </div>
                    </CardContent>
                </Card>

                {/* PANEL DE ALERTAS */}
                <Card className="lg:col-span-3 border-l-4 border-l-amber-500 shadow-sm bg-white">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-amber-100 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-900">Análisis de Restricciones</h4>
                                {alertas.length > 0 ? (
                                    <div className="flex gap-3 mt-2 overflow-x-auto pb-1">
                                        {alertas.map((a, i) => (
                                            <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 py-1">
                                                {a.fecha}: +{a.pedidos_predichos - capacidadMaxima} pedidos
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-emerald-600 mt-1">Capacidad suficiente para cubrir la demanda proyectada.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}