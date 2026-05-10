"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  IconRobot,
  IconSend,
  IconPhoto,
  IconTrash,
  IconPlus,
  IconLoader2,
  IconX,
  IconMessageCircle,
  IconSquare,
  IconMenu2,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useChat, type ChatMessage, type ChatSession } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import {
  renderMarkdown,
  handleClipboardPaste,
  handleFileSelect,
  formatTime,
  formatShortDate,
  categorizeSessions,
} from "./chat-logic"

// ============================================================
// Message Bubble (Full version)
// ============================================================

function MessageBubbleFull({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  const time = formatTime(message.created_at || "")

  return (
    <div className={cn("flex w-full mb-4 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mr-2.5 mt-1 shrink-0 shadow-sm">
          <IconRobot size={16} className="text-primary-foreground" />
        </div>
      )}
      <div className="flex flex-col max-w-[75%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card text-card-foreground rounded-bl-md border border-border/50",
          )}
        >
          {message.has_image && isUser && (
            <div className="flex items-center gap-1.5 mb-2 text-xs opacity-70">
              <IconPhoto size={14} />
              <span>Imagen adjunta</span>
            </div>
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.content ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none [&_br]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          ) : (
            <div className="flex items-center gap-1.5 py-1">
              <span className="inline-block w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="inline-block w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="inline-block w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 mt-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {time && <span>{time}</span>}
          {message.model_used && <span className="font-mono">• {message.model_used}</span>}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Session List Item
// ============================================================

function SessionItem({
  session,
  isActive,
  onClick,
  onDelete,
}: {
  session: ChatSession
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const date = formatShortDate(session.updated_at)

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-primary/10 border border-primary/20 shadow-sm"
          : "hover:bg-muted/50 border border-transparent",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isActive && "text-primary")}>
            {session.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {date} • {session.message_count || 0} mensajes
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <IconTrash size={13} className="text-destructive" />
        </Button>
      </div>
    </button>
  )
}

// ============================================================
// Chat Component (Full Page)
// ============================================================

export function Chat() {
  const [inputText, setInputText] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const chat = useChat()

  // Set page context for dedicated chat (no page-specific context)
  useEffect(() => {
    chat.setCurrentPage("/system/chatbot/chat")
    chat.loadSessions()
    chat.loadModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [chat.messages])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text && !imageBase64) return

    setInputText("")
    const img = imageBase64
    setImageBase64(null)
    setImagePreview(null)

    await chat.sendMessage(text, img || undefined)
  }, [inputText, imageBase64, chat])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Clipboard paste handler (Ctrl+V)
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const result = await handleClipboardPaste(e)
    if (result) {
      setImagePreview(result.preview)
      setImageBase64(result.base64)
    }
  }, [])

  const onFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = await handleFileSelect(e)
    if (result) {
      setImagePreview(result.preview)
      setImageBase64(result.base64)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const removeImage = () => {
    setImagePreview(null)
    setImageBase64(null)
  }

  const confirmDelete = () => {
    if (sessionToDelete !== null) {
      chat.deleteSession(sessionToDelete)
    }
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  const selectSession = (session: ChatSession) => {
    chat.setActiveSession(session)
    chat.loadMessages(session.id)
  }

  const categorized = categorizeSessions(chat.sessions)

  // Default suggestions for the dedicated chat page
  const defaultSuggestions = [
    "¿Cómo interpreto el CLV de mis clientes?",
    "Explica la predicción de ventas semanales",
    "¿Qué significa la detección de rentabilidad?",
    "Analiza esta gráfica de ventas",
  ]

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Sessions Sidebar */}
      <div
        className={cn(
          "border-r border-border/50 bg-muted/20 flex flex-col transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden",
        )}
      >
        <div className="p-3 border-b border-border/50">
          <Button
            onClick={() => chat.createSession()}
            className="w-full justify-start gap-2 rounded-xl h-10"
            variant="outline"
          >
            <IconPlus size={16} />
            <span className="text-sm">Nueva conversación</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chat.isLoading && chat.sessions.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <IconLoader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {categorized.today.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1">
                  Hoy
                </p>
                {categorized.today.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    isActive={chat.activeSession?.id === s.id}
                    onClick={() => selectSession(s)}
                    onDelete={() => {
                      setSessionToDelete(s.id)
                      setDeleteDialogOpen(true)
                    }}
                  />
                ))}
              </>
            )}

            {categorized.week.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">
                  Esta semana
                </p>
                {categorized.week.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    isActive={chat.activeSession?.id === s.id}
                    onClick={() => selectSession(s)}
                    onDelete={() => {
                      setSessionToDelete(s.id)
                      setDeleteDialogOpen(true)
                    }}
                  />
                ))}
              </>
            )}

            {categorized.older.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">
                  Anteriores
                </p>
                {categorized.older.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    isActive={chat.activeSession?.id === s.id}
                    onClick={() => selectSession(s)}
                    onDelete={() => {
                      setSessionToDelete(s.id)
                      setDeleteDialogOpen(true)
                    }}
                  />
                ))}
              </>
            )}

            {chat.sessions.length === 0 && !chat.isLoading && (
              <div className="text-center py-8">
                <IconMessageCircle size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Sin conversaciones</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <IconMenu2 size={18} />
            </Button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <IconRobot size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-none">
                {chat.activeSession?.title || "HGC Assistant"}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {chat.isStreaming ? "Escribiendo..." : "Listo para ayudarte"}
              </p>
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <Select
              value={chat.selectedModel || "auto"}
              onValueChange={(v) => chat.setSelectedModel(v === "auto" ? null : v)}
            >
              <SelectTrigger className="w-[200px] h-8 text-xs rounded-lg">
                <SelectValue placeholder="Modelo automático" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Automático
                  </span>
                </SelectItem>
                {chat.models.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          m.name.includes("llava") || m.name.includes("vision")
                            ? "bg-violet-500"
                            : "bg-sky-500",
                        )}
                      />
                      {m.name}
                      <span className="text-[10px] text-muted-foreground">
                        {m.name.includes("llava") || m.name.includes("vision")
                          ? "(visión)"
                          : "(chat)"}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
          {chat.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mb-5 shadow-sm">
                <IconRobot size={40} className="text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                Asistente Inteligente HGC
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Puedo ayudarte con análisis de datos, predicciones, econometría y consultas del
                sistema. También puedo analizar imágenes que me envíes. Pega una imagen con Ctrl+V.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                {defaultSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInputText(q)
                      textareaRef.current?.focus()
                    }}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.messages.map((msg, i) => (
            <MessageBubbleFull key={i} message={msg} />
          ))}
        </ScrollArea>

        {/* Error */}
        {chat.error && (
          <div className="mx-6 mb-2 px-4 py-2.5 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-center justify-between">
            <span>{chat.error}</span>
            <button onClick={() => chat.setError(null)} className="text-xs underline ml-4">
              Cerrar
            </button>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mx-6 mb-2 relative inline-flex">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-xl border border-border shadow-sm"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-muted/10">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={chat.isStreaming}
                >
                  <IconPhoto size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adjuntar imagen (o pega con Ctrl+V)</TooltipContent>
            </Tooltip>
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Escribe un mensaje o pega una imagen (Ctrl+V)..."
                className="min-h-[44px] max-h-[160px] resize-none text-sm border-border/50 bg-background rounded-xl pr-12"
                rows={1}
                disabled={chat.isStreaming}
              />
            </div>
            {chat.isStreaming ? (
              <Button
                size="icon"
                variant="destructive"
                className="h-10 w-10 shrink-0 rounded-xl"
                onClick={chat.stopStreaming}
              >
                <IconSquare size={16} />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl"
                onClick={handleSend}
                disabled={!inputText.trim() && !imageBase64}
              >
                <IconSend size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede
              deshacer.
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