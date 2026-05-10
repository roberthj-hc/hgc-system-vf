"use client"

import { useState, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_URL } from "@/lib/config"

// ============================================================
// Types
// ============================================================

export interface ChatSession {
  id: number
  user_id: number
  title: string
  created_at: string
  updated_at: string
  message_count?: number
  last_message?: string
}

export interface ChatMessage {
  id?: number
  session_id?: number
  role: "user" | "assistant" | "system"
  content: string
  has_image?: boolean
  model_used?: string
  created_at?: string
}

export interface OllamaModel {
  name: string
  size: number
  modified: string
}

export interface PageContext {
  greeting: string
  suggestions: string[]
  context?: string
}

// ============================================================
// Hook
// ============================================================

export function useChat() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageContext, setPageContext] = useState<PageContext | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const currentPageRef = useRef<string | null>(null)

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  )

  // ---- Set current page ----
  const setCurrentPage = useCallback((page: string) => {
    currentPageRef.current = page
  }, [])

  // ---- Models ----
  const loadModels = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/chatbot/models`, {
        headers: headers(),
      })
      if (res.ok) {
        const data = await res.json()
        setModels(data)
      }
    } catch {
      console.error("No se pudo cargar modelos de Ollama")
    }
  }, [headers])

  // ---- Page context ----
  const loadPageContext = useCallback(
    async (page: string) => {
      try {
        const res = await fetch(
          `${API_URL}/api/chatbot/page-context?page=${encodeURIComponent(page)}`,
          { headers: headers() },
        )
        if (res.ok) {
          const data = await res.json()
          setPageContext(data)
          return data as PageContext
        }
      } catch {
        console.error("No se pudo cargar contexto de página")
      }
      return null
    },
    [headers],
  )

  // ---- Sessions ----
  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/chatbot/sessions`, {
        headers: headers(),
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch {
      setError("Error cargando sesiones")
    } finally {
      setIsLoading(false)
    }
  }, [headers])

  const createSession = useCallback(
    async (title?: string) => {
      try {
        const res = await fetch(`${API_URL}/api/chatbot/sessions`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ title }),
        })
        if (res.ok) {
          const session = await res.json()
          setSessions((prev) => [session, ...prev])
          setActiveSession(session)
          setMessages([])
          return session
        }
      } catch {
        setError("Error creando sesión")
      }
      return null
    },
    [headers],
  )

  const deleteSession = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`${API_URL}/api/chatbot/sessions/${id}`, {
          method: "DELETE",
          headers: headers(),
        })
        if (res.ok) {
          setSessions((prev) => prev.filter((s) => s.id !== id))
          if (activeSession?.id === id) {
            setActiveSession(null)
            setMessages([])
          }
        }
      } catch {
        setError("Error eliminando sesión")
      }
    },
    [headers, activeSession],
  )

  const loadMessages = useCallback(
    async (sessionId: number) => {
      try {
        setIsLoading(true)
        const res = await fetch(
          `${API_URL}/api/chatbot/sessions/${sessionId}`,
          { headers: headers() },
        )
        if (res.ok) {
          const data = await res.json()
          setActiveSession(data.session)
          setMessages(data.messages)
        }
      } catch {
        setError("Error cargando mensajes")
      } finally {
        setIsLoading(false)
      }
    },
    [headers],
  )

  // ---- Chat (streaming) ----
  const sendMessage = useCallback(
    async (text: string, image?: string) => {
      setError(null)
      setIsStreaming(true)

      // Agregar mensaje del usuario al estado local inmediatamente
      const userMsg: ChatMessage = {
        role: "user",
        content: text || "[Imagen enviada para análisis]",
        has_image: !!image,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])

      // Placeholder para la respuesta del asistente
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      try {
        const abortController = new AbortController()
        abortRef.current = abortController

        // Determinar modelo: si hay imagen forzar llava, si no, usar seleccionado o default
        let model = selectedModel
        if (image) {
          // Forzar modelo de visión si hay imagen
          const visionModel = models.find(
            (m) =>
              m.name.includes("llava") ||
              m.name.includes("vision") ||
              m.name.includes("bakllava"),
          )
          model = visionModel?.name || "llava:7b"
        } else if (!model || model === "auto") {
          const chatModel = models.find(
            (m) =>
              m.name.includes("deepseek") ||
              m.name.includes("llama") ||
              m.name.includes("mistral"),
          )
          model = chatModel?.name || "deepseek-r1:8b"
        }

        const res = await fetch(`${API_URL}/api/chatbot/chat`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            sessionId: activeSession?.id || null,
            message: text,
            image: image || undefined,
            model,
            currentPage: currentPageRef.current,
          }),
          signal: abortController.signal,
        })

        if (!res.ok) {
          throw new Error("Error en la respuesta del servidor")
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No se pudo leer la respuesta")

        const decoder = new TextDecoder()
        let buffer = ""
        let fullContent = ""
        let newSessionId: number | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const jsonStr = line.slice(6)
            try {
              const parsed = JSON.parse(jsonStr)

              if (parsed.type === "session") {
                newSessionId = parsed.sessionId
                if (!activeSession) {
                  setActiveSession({
                    id: parsed.sessionId,
                    user_id: 0,
                    title: text.substring(0, 80),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                }
              }

              if (parsed.type === "chunk") {
                fullContent += parsed.content
                setMessages((prev) => {
                  const updated = [...prev]
                  const lastIdx = updated.length - 1
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: fullContent,
                  }
                  return updated
                })
              }

              if (parsed.type === "done") {
                setMessages((prev) => {
                  const updated = [...prev]
                  const lastIdx = updated.length - 1
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: fullContent,
                    model_used: parsed.model,
                  }
                  return updated
                })
              }

              if (parsed.type === "error") {
                setError(parsed.content)
              }
            } catch {
              // línea no parseable
            }
          }
        }

        // Recargar sesiones para actualizar títulos
        if (newSessionId) {
          loadSessions()
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Error enviando mensaje")
          // Remover mensaje de asistente vacío
          setMessages((prev) => prev.slice(0, -1))
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [activeSession, headers, loadSessions, models, selectedModel],
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return {
    // State
    sessions,
    activeSession,
    messages,
    models,
    selectedModel,
    isLoading,
    isStreaming,
    error,
    pageContext,
    // Actions
    loadModels,
    loadSessions,
    loadPageContext,
    createSession,
    deleteSession,
    loadMessages,
    sendMessage,
    stopStreaming,
    setActiveSession,
    setMessages,
    setSelectedModel,
    setCurrentPage,
    setError,
  }
}
