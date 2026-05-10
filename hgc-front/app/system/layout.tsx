"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { ChatBubble } from "@/components/chat-bubble"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login")
        }
    }, [loading, user, router])

    // Mostrar loader mientras verifica sesión
    if (loading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Cargando…</p>
                </div>
            </div>
        )
    }

    // Sin sesión, no renderizar nada (el useEffect redirige)
    if (!user) {
        return null
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 16)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />

            <SidebarInset>
                <SiteHeader />

                <div className="flex flex-1 flex-col">
                    {children}
                </div>
            </SidebarInset>

            {/* Floating Chat Bubble - appears on all /system pages */}
            <ChatBubble />
        </SidebarProvider>
    )
}