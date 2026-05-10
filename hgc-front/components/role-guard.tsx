"use client"

import { useAuth } from "@/lib/auth-context"
import { hasRouteAccess, type UserRole } from "@/lib/role-permissions"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { IconShieldLock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface RoleGuardProps {
  allowedRoles: UserRole[] | "GLOBAL"
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [loading, user, router])

  // Mientras carga, mostrar skeleton
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando acceso…</p>
        </div>
      </div>
    )
  }

  // Sin sesión
  if (!user) {
    return null
  }

  // Verificar permiso
  const hasAccess =
    allowedRoles === "GLOBAL" ||
    allowedRoles.includes(user.cargo as UserRole) ||
    hasRouteAccess(user.cargo, pathname)

  if (!hasAccess) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <div className="rounded-full bg-destructive/10 p-4">
            <IconShieldLock className="size-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Acceso Denegado
          </h2>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a esta sección. Tu cargo actual es{" "}
            <span className="font-semibold text-foreground">{user.cargo}</span>.
            Contacta al administrador si necesitas acceso.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/system")}
            className="mt-2"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
