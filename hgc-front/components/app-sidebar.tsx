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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
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
        { title: "Espejo del negocio", url: "/system/time-series/mirror" },
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
        { title: "Chat", url: "#" },
        { title: "Historial", url: "#" },
      ],
    },
  ],
  navSecondary: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:h-18! "
            >
              <a href="#">
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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
