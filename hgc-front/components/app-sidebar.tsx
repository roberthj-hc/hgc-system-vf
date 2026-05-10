"use client"

import * as React from "react"
import {
  IconChartBar,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconMathFunction,
  IconRobot,
  IconTrendingUp,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { hasModuleAccess } from "@/lib/role-permissions"

const allNavMain = [
  {
    title: "Minería de Datos",
    icon: IconChartBar,
    items: [
      { title: "Valor del Cliente", url: "/system/predictions/clv" },
      { title: "Fuga de Clientes", url: "/system/predictions/churn" },
    ],
  },
  {
    title: "Series de Tiempo",
    icon: IconTrendingUp,
    items: [
      { title: "Ventas semanales", url: "/system/time-series/mirror" },
      { title: "Detección de rentabilidad", url: "/system/time-series/profit" },
      { title: "Apertura de sucursales", url: "/system/time-series/simulator" },
    ],
  },
  {
    title: "Econometría",
    icon: IconMathFunction,
    items: [
      { title: "Optimizador de margen", url: "/system/econometrics/price-optimizer" },
      { title: "Monitor de eficiencia", url: "/system/econometrics/efficiency-monitor" },
    ],
  },
  {
    title: "Asistente",
    icon: IconRobot,
    items: [
      { title: "Chat", url: "/system/chatbot/chat" },
      { title: "Historial", url: "/system/chatbot/history" },
    ],
  },
]

const navSecondary = [
  {
    title: "Ajustes",
    url: "#",
    icon: IconSettings,
  },
  {
    title: "Obtener Ayuda",
    url: "#",
    icon: IconHelp,
  },
  {
    title: "Buscar",
    url: "#",
    icon: IconSearch,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Filtrar módulos del sidebar según el cargo del usuario
  const filteredNav = React.useMemo(() => {
    if (!user) return []
    return allNavMain.filter((item) => hasModuleAccess(user.cargo, item.title))
  }, [user])

  const userData = {
    name: user?.nombre || "Usuario",
    email: user?.email || "",
    avatar: "/icon.png",
    cargo: user?.cargo || "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:h-18! "
            >
              <a href="/system">
                <Image
                  src="/hgc-chicken.png"
                  alt="HGC"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <span className="text-base font-semibold">HGC</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
