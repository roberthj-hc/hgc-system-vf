// ============================================================
// Mapa centralizado de permisos por ruta
// ============================================================

/** Todos los cargos válidos del sistema */
export const ALL_ROLES = [
  "CEO",
  "COO",
  "CFO",
  "CMO",
  "GERENTE_REGIONAL",
  "GERENTE_MARKETING",
  "JEFE_LOGISTICA",
  "RRHH_CALIDAD",
  "ADMIN_TIENDA",
  "STAFF",
] as const;

export type UserRole = (typeof ALL_ROLES)[number];

/** Etiquetas legibles para cada cargo */
export const ROLE_LABELS: Record<UserRole, string> = {
  CEO: "Gerente General (CEO)",
  COO: "Dir. Operaciones (COO)",
  CFO: "Dir. Finanzas (CFO)",
  CMO: "Dir. Marketing (CMO)",
  GERENTE_REGIONAL: "Gerente Regional",
  GERENTE_MARKETING: "Gerente de Marketing",
  JEFE_LOGISTICA: "Jefe de Logística",
  RRHH_CALIDAD: "RRHH / Control de Calidad",
  ADMIN_TIENDA: "Administrador de Tienda",
  STAFF: "Personal Operativo",
};

/**
 * Permisos por ruta.
 * "GLOBAL" significa que todos los roles autenticados tienen acceso.
 */
export const ROLE_PERMISSIONS: Record<string, UserRole[] | "GLOBAL"> = {
  // Minería de Datos
  "/system/predictions/clv": [
    "CEO",
    "COO",
    "CMO",
    "GERENTE_REGIONAL",
    "GERENTE_MARKETING",
  ],
  "/system/predictions/churn": [
    "CEO",
    "COO",
    "CMO",
    "GERENTE_REGIONAL",
    "GERENTE_MARKETING",
  ],

  // Series de Tiempo
  "/system/time-series/mirror": [
    "CEO",
    "COO",
    "GERENTE_REGIONAL",
    "JEFE_LOGISTICA",
    "ADMIN_TIENDA",
  ],
  "/system/time-series/profit": [
    "CEO",
    "COO",
    "GERENTE_REGIONAL",
    "JEFE_LOGISTICA",
    "ADMIN_TIENDA",
  ],
  "/system/time-series/simulator": [
    "CEO",
    "COO",
    "GERENTE_REGIONAL",
    "JEFE_LOGISTICA",
    "ADMIN_TIENDA",
  ],

  // Econometría
  "/system/econometrics/price-optimizer": ["CEO", "CFO"],
  "/system/econometrics/efficiency-monitor": ["CEO", "CFO"],

  // Asistente — acceso global
  "/system/chatbot/chat": "GLOBAL",
  "/system/chatbot/history": "GLOBAL",

  // Dashboard principal — acceso global
  "/system": "GLOBAL",
};

/**
 * Verifica si un cargo tiene acceso a una ruta dada.
 */
export function hasRouteAccess(cargo: string, route: string): boolean {
  const permission = ROLE_PERMISSIONS[route];
  if (!permission) return true; // Ruta sin restricción definida
  if (permission === "GLOBAL") return true;
  return permission.includes(cargo as UserRole);
}

/**
 * Permisos por módulo del sidebar.
 * Define qué roles pueden VER cada sección del menú lateral.
 */
export const MODULE_PERMISSIONS: Record<string, UserRole[] | "GLOBAL"> = {
  "Minería de Datos": [
    "CEO",
    "COO",
    "CMO",
    "GERENTE_REGIONAL",
    "GERENTE_MARKETING",
  ],
  "Series de Tiempo": [
    "CEO",
    "COO",
    "GERENTE_REGIONAL",
    "JEFE_LOGISTICA",
    "ADMIN_TIENDA",
  ],
  Econometría: ["CEO", "CFO"],
  Asistente: "GLOBAL",
};

/**
 * Verifica si un cargo tiene acceso a un módulo del sidebar.
 */
export function hasModuleAccess(cargo: string, moduleTitle: string): boolean {
  const permission = MODULE_PERMISSIONS[moduleTitle];
  if (!permission) return true;
  if (permission === "GLOBAL") return true;
  return permission.includes(cargo as UserRole);
}
