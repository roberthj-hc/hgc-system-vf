"use client"

import { RoleGuard } from "@/components/role-guard"
import { Chat } from "./Chat"

export default function Page() {
  return (
    <RoleGuard allowedRoles="GLOBAL">
      <div className="px-4 py-6 xl:px-12 xl:py-10 w-full space-y-6">
        <Chat />
      </div>
    </RoleGuard>
  )
}