// ============================================================
// Chat utility functions — logic separated from UI components
// ============================================================

/**
 * Renders a lite markdown string to HTML.
 * Strips deepseek-r1 <think> blocks and converts basic markdown syntax.
 */
export function renderMarkdown(text: string): string {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim()

  cleaned = cleaned
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
      return `<pre class="bg-muted/80 border border-border/50 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono"><code>${code.trim()}</code></pre>`
    })
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>',
    )
    .replace(
      /^### (.*$)/gm,
      '<h4 class="font-semibold text-sm mt-3 mb-1.5">$1</h4>',
    )
    .replace(
      /^## (.*$)/gm,
      '<h3 class="font-semibold text-base mt-3 mb-1.5">$1</h3>',
    )
    .replace(
      /^# (.*$)/gm,
      '<h2 class="font-bold text-lg mt-3 mb-1.5">$1</h2>',
    )
    .replace(
      /^[-*] (.*$)/gm,
      '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>',
    )
    .replace(
      /^(\d+)\. (.*$)/gm,
      '<li class="ml-4 list-decimal text-sm leading-relaxed">$2</li>',
    )
    .replace(/\n/g, "<br/>")

  return cleaned
}

// ============================================================
// Image handling utilities
// ============================================================

/**
 * Converts a File to base64 (without the data:... prefix).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Converts a Blob to base64 (without the data:... prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Handles a file input change event and returns { preview, base64 } or null.
 */
export async function handleFileSelect(
  e: React.ChangeEvent<HTMLInputElement>,
): Promise<{ preview: string; base64: string } | null> {
  const file = e.target.files?.[0]
  if (!file) return null

  const preview = URL.createObjectURL(file)
  const base64 = await fileToBase64(file)
  return { preview, base64 }
}

/**
 * Handles a clipboard paste event and extracts image data if present.
 * Returns { preview, base64 } or null if no image in clipboard.
 */
export async function handleClipboardPaste(
  e: React.ClipboardEvent,
): Promise<{ preview: string; base64: string } | null> {
  const items = e.clipboardData?.items
  if (!items) return null

  for (const item of Array.from(items)) {
    if (item.type.startsWith("image/")) {
      e.preventDefault() // Prevent default paste behavior for images
      const blob = item.getAsFile()
      if (!blob) continue

      const preview = URL.createObjectURL(blob)
      const base64 = await blobToBase64(blob)
      return { preview, base64 }
    }
  }

  return null // No image found, let normal paste proceed
}

// ============================================================
// Date formatting utilities
// ============================================================

/**
 * Formats a date string to short time (HH:MM).
 */
export function formatTime(dateStr: string): string {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Formats a date string to short date (day month).
 */
export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  })
}

/**
 * Returns a relative time string (e.g., "Hace 5 min").
 */
export function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ============================================================
// Session categorization
// ============================================================

import type { ChatSession } from "@/hooks/use-chat"

export interface CategorizedSessions {
  today: ChatSession[]
  week: ChatSession[]
  older: ChatSession[]
}

/**
 * Categorizes sessions by recency: today, this week, and older.
 */
export function categorizeSessions(
  sessions: ChatSession[],
): CategorizedSessions {
  const today: ChatSession[] = []
  const week: ChatSession[] = []
  const older: ChatSession[] = []
  const now = new Date()

  for (const s of sessions) {
    const diff = now.getTime() - new Date(s.updated_at).getTime()
    const days = diff / (1000 * 60 * 60 * 24)
    if (days < 1) today.push(s)
    else if (days < 7) week.push(s)
    else older.push(s)
  }

  return { today, week, older }
}
