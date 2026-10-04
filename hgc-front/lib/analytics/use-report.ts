"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import type { AnalyticsReport, Module } from "./types";

export function useReport(module: Module) {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [branch, setBranchState] = useState("all");
  const [search, setSearchState] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const query = new URLSearchParams({branch,search,page:String(page),page_size:"25"});
        const response = await fetch(`${API_URL}/api/analytics/${module}?${query}`, {
          headers:{Authorization:`Bearer ${token}`}, signal:controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "No se pudo cargar el análisis");
        setData(payload);
      } catch (cause) {
        if (!controller.signal.aborted) {setError(cause instanceof Error ? cause.message : "Error de conexión"); setData(null);}
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 180);
    return () => {clearTimeout(timer); controller.abort();};
  }, [module,token,branch,search,page,refresh]);
  return {data,error,loading,branch,search,page,setPage,
    setBranch:(value:string)=>{setBranchState(value);setPage(1);},
    setSearch:(value:string)=>{setSearchState(value);setPage(1);},
    retry:()=>setRefresh(v=>v+1)};
}
