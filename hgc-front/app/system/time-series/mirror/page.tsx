"use client"

import { RoleGuard } from "@/components/role-guard"
import { TimeSeriesMirror } from "./TimeSeriesMirror"

export default function Page() {
  return (
    <RoleGuard allowedRoles={["CEO", "COO", "GERENTE_REGIONAL", "JEFE_LOGISTICA", "ADMIN_TIENDA"]}>
      <div className="px-4 py-6 xl:px-12 xl:py-10 w-full space-y-6">
        <TimeSeriesMirror />
      </div>
    </RoleGuard>
  )
}