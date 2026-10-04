export type Row = Record<string, string | number | null>;
export type Module = "sales" | "profit" | "expansion" | "clv" | "churn" | "margin" | "efficiency";
export interface AnalyticsReport {
  title: string; description: string; rows: Row[];
  kpis: { label: string; value: number; unit: string }[];
  kpi_scope: string;
  branches: { id_sucursal: number; sucursal: string }[];
  series: Row[]; forecast: Row[];
  pagination: { page: number; pages: number; total: number; page_size: number };
  evaluated_at: string; release_id: string; load_id: string; published_at: string;
  cutoff?: string; limitations?: string;
  quality: { table: string; rows: number }[];
  model?: { run_id: string; algorithm: string; cutoff: string; validation: string;
    limitations: string; metrics: Record<string, number> };
}
export type Column = { key: string; label: string; unit?: string };
export const money = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 0 });
export function format(value: unknown, unit = "number") {
  if (value === null || value === undefined) return "—";
  if (unit === "date") return String(value).slice(0, 10);
  if (typeof value !== "number") return String(value);
  if (unit === "money") return money.format(value);
  if (unit === "percent") return new Intl.NumberFormat("es-BO", {style:"percent", maximumFractionDigits:1}).format(value);
  return new Intl.NumberFormat("es-BO", {maximumFractionDigits:2}).format(value);
}
