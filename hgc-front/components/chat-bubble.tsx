"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  IconRobot,
  IconSend,
  IconX,
  IconPhoto,
  IconMaximize,
  IconPlus,
  IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useChat, type ChatMessage, type PageContext } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import {
  renderMarkdown,
  handleClipboardPaste,
  handleFileSelect,
} from "@/app/system/chatbot/chat/chat-logic"

// ============================================================
// Message Bubble (compact for bubble)
// ============================================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full mb-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted/70 text-foreground rounded-bl-md border border-border/50",
        )}
      >
        {message.has_image && isUser && (
          <div className="flex items-center gap-1.5 mb-1.5 text-xs opacity-70">
            <IconPhoto size={12} />
            <span>Imagen adjunta</span>
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : message.content ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none [&_br]:leading-tight"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        {message.model_used && !isUser && (
          <div className="mt-1.5 text-[10px] opacity-50 font-mono">
            {message.model_used}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Chat Bubble Component
// ============================================================

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [bubblePageCtx, setBubblePageCtx] = useState<PageContext | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const chat = useChat()

  // Auto-detect current page and set context
  useEffect(() => {
    if (pathname) {
      chat.setCurrentPage(pathname)
    }
  }, [pathname, chat.setCurrentPage])

  // Load page context when bubble opens
  useEffect(() => {
    if (isOpen && pathname) {
      chat.loadSessions()
      chat.loadModels()
      chat.loadPageContext(pathname).then((ctx) => {
        if (ctx) setBubblePageCtx(ctx)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pathname])

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

  const openFullChat = () => {
    setIsOpen(false)
    router.push("/system/chatbot/chat")
  }

  // Greeting and suggestions from page context
  const greeting = bubblePageCtx?.greeting || "¡Hola! 👋 Soy el Asistente HGC"
  const suggestions = bubblePageCtx?.suggestions || []

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="chat-bubble-button"
                onClick={() => setIsOpen(true)}
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-primary to-primary/80"
              >
                <IconRobot size={26} className="text-primary-foreground" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Asistente HGC</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Chat Panel */}
        {isOpen && (
          <div
            className={cn(
              "absolute bottom-0 right-0 w-[400px] h-[560px] flex flex-col",
              "bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/10",
              "animate-in slide-in-from-bottom-4 fade-in-0 duration-300",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                  <IconRobot size={18} className="text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-none">HGC Assistant</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {chat.isStreaming ? "Escribiendo..." : "En línea"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => chat.createSession()}
                    >
                      <IconPlus size={15} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Nueva conversación</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={openFullChat}
                    >
                      <IconMaximize size={15} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir chat completo</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <IconX size={15} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3">
              {chat.messages.length === 0 && !chat.isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mb-3">
                    <IconRobot size={28} className="text-primary/60" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80 mb-3 px-4">
                    {greeting}
                  </p>
                  {suggestions.length > 0 && (
                    <div className="flex flex-col gap-1.5 w-full px-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setInputText(s)
                            textareaRef.current?.focus()
                          }}
                          className="text-left text-xs px-3 py-2 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {chat.messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
            </ScrollArea>

            {/* Error */}
            {chat.error && (
              <div className="mx-4 mb-2 px-3 py-2 text-xs text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                {chat.error}
                <button onClick={() => chat.setError(null)} className="ml-2 underline text-[10px]">
                  Cerrar
                </button>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mx-4 mb-2 relative inline-flex">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm"
                >
                  <IconX size={12} />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border/50 bg-muted/20 rounded-b-2xl">
              <div className="flex items-end gap-2">
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
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={chat.isStreaming}
                    >
                      <IconPhoto size={18} className="text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Adjuntar imagen</TooltipContent>
                </Tooltip>
                <Textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Escribe o pega imagen (Ctrl+V)..."
                  className="min-h-[38px] max-h-[100px] resize-none text-sm border-border/50 bg-background/80 rounded-xl"
                  rows={1}
                  disabled={chat.isStreaming}
                />
                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-xl"
                  onClick={handleSend}
                  disabled={chat.isStreaming && !inputText.trim() && !imageBase64}
                >
                  {chat.isStreaming ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconSend size={16} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
