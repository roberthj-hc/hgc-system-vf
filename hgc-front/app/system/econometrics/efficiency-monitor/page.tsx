"use client"

import { RoleGuard } from "@/components/role-guard"
import { EconometricsEfficiency } from "./EconometricsEfficiency"

export default function Page() {
  return (
    <RoleGuard allowedRoles={["CEO", "CFO"]}>
      <div className="px-4 py-6 xl:px-12 xl:py-10 w-full space-y-6">
        <EconometricsEfficiency />
      </div>
    </RoleGuard>
  )
}