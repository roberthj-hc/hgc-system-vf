"use client"

import { RoleGuard } from "@/components/role-guard"
import { PredictionChurn } from "./PredictionChurn"

export default function Page() {
  return (
    <RoleGuard allowedRoles={["CEO", "COO", "CMO", "GERENTE_REGIONAL", "GERENTE_MARKETING"]}>
      <div className="px-4 py-6 xl:px-12 xl:py-10 w-full space-y-6">
        <PredictionChurn />
      </div>
    </RoleGuard>
  )
}