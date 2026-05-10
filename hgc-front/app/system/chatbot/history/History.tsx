"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconMessageCircle,
  IconTrash,
  IconExternalLink,
  IconLoader2,
  IconRobot,
  IconCalendar,
  IconMessages,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useChat, type ChatSession } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"

export function History() {
  const chat = useChat()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null)

  useEffect(() => {
    chat.loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirmDelete = () => {
    if (sessionToDelete !== null) {
      chat.deleteSession(sessionToDelete)
    }
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  const openSession = (sessionId: number) => {
    router.push(`/system/chatbot/chat?session=${sessionId}`)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return "Ahora"
    if (mins < 60) return `Hace ${mins} min`
    if (hours < 24) return `Hace ${hours}h`
    if (days < 7) return `Hace ${days}d`
    return formatDate(dateStr)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial de Conversaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa y gestiona tus conversaciones pasadas con el Asistente HGC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {chat.sessions.length} conversaciones
          </Badge>
          <Button
            onClick={() => router.push("/system/chatbot/chat")}
            className="gap-2 rounded-xl"
          >
            <IconMessageCircle size={16} />
            Nuevo Chat
          </Button>
        </div>
      </div>

      {/* Loading */}
      {chat.isLoading && chat.sessions.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <IconLoader2 size={24} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando historial...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!chat.isLoading && chat.sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mb-5">
            <IconMessages size={36} className="text-primary/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground/70 mb-1">
            Sin conversaciones aún
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Inicia tu primera conversación con el Asistente HGC para ver tu historial aquí.
          </p>
          <Button onClick={() => router.push("/system/chatbot/chat")} className="gap-2 rounded-xl">
            <IconRobot size={16} />
            Iniciar conversación
          </Button>
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {chat.sessions.map((session) => (
          <Card
            key={session.id}
            className={cn(
              "group cursor-pointer transition-all duration-200",
              "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
              "border-border/50 bg-card/80 backdrop-blur-sm",
            )}
            onClick={() => openSession(session.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                  <IconRobot size={18} className="text-primary/60" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      openSession(session.id)
                    }}
                  >
                    <IconExternalLink size={14} className="text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSessionToDelete(session.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <IconTrash size={14} className="text-destructive" />
                  </Button>
                </div>
              </div>

              <h3 className="text-sm font-semibold truncate mb-1.5 group-hover:text-primary transition-colors">
                {session.title}
              </h3>

              {session.last_message && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                  {session.last_message}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <IconCalendar size={12} />
                  <span>{getRelativeTime(session.updated_at)}</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                  {session.message_count || 0} msgs
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta conversación y todos sus mensajes? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}