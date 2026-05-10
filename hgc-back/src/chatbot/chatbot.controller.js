const chatService = require("./chatbot.service");
const { ollamaUrl } = require("../config/env");
const { buildSystemPrompt, getPageConfig } = require("./prompts");

// ============================================================
// Controller: Chat (streaming SSE)
// ============================================================

const chat = async (req, res) => {
  try {
    const userId = req.user.id;
    let { sessionId, message, image, model, currentPage } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: "Se requiere un mensaje o imagen" });
    }

    // Si no hay sesión, crear una nueva
    if (!sessionId) {
      const session = await chatService.createSession(userId);
      sessionId = session.id;
    }

    // Verificar que la sesión pertenece al usuario
    const session = await chatService.getSessionById(sessionId, userId);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    // Determinar modelo automáticamente si no se especifica
    const hasImage = !!image;
    if (!model || model === "auto") {
      model = hasImage ? "llava:7b" : "deepseek-r1:8b";
    }

    // Guardar mensaje del usuario
    const userContent = message || "[Imagen enviada para análisis]";
    await chatService.saveMessage(sessionId, "user", userContent, hasImage);

    // Auto-generar título si es el primer mensaje
    const msgCount = await chatService.countMessages(sessionId);
    if (msgCount <= 1) {
      const title = userContent.substring(0, 80) + (userContent.length > 80 ? "…" : "");
      await chatService.updateSessionTitle(sessionId, title);
    }

    // Recuperar contexto (últimos 20 mensajes)
    const contextMessages = await chatService.getContextMessages(sessionId, 20);

    // Construir system prompt basado en la página actual
    const systemPrompt = buildSystemPrompt(currentPage || null);

    // Construir mensajes para Ollama
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...contextMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Si hay imagen, añadirla al último mensaje
    const ollamaPayload = {
      model,
      messages: ollamaMessages,
      stream: true,
    };

    if (hasImage) {
      // Agregar la imagen al último mensaje del usuario en el array
      const lastMsg = ollamaPayload.messages[ollamaPayload.messages.length - 1];
      lastMsg.images = [image]; // base64 sin prefijo data:...
    }

    // Configurar SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Session-Id": sessionId.toString(),
    });

    // Enviar sessionId como primer evento
    res.write(`data: ${JSON.stringify({ type: "session", sessionId })}\n\n`);

    // Llamar a Ollama con streaming
    const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ollamaPayload),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error("Ollama error:", errorText);
      res.write(`data: ${JSON.stringify({ type: "error", content: "Error al comunicarse con el modelo de IA" })}\n\n`);
      res.end();
      return;
    }

    // Leer el streaming de Ollama línea por línea
    let fullResponse = "";
    const reader = ollamaResponse.body;
    const decoder = new TextDecoder();
    let buffer = "";

    for await (const chunk of reader) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Mantener la última línea incompleta

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message && parsed.message.content) {
            fullResponse += parsed.message.content;
            res.write(`data: ${JSON.stringify({ type: "chunk", content: parsed.message.content })}\n\n`);
          }
          if (parsed.done) {
            // Guardar respuesta completa en la BD
            await chatService.saveMessage(sessionId, "assistant", fullResponse, false, model);
            res.write(`data: ${JSON.stringify({ type: "done", model })}\n\n`);
          }
        } catch (e) {
          // Línea no parseable, ignorar
        }
      }
    }

    // Procesar cualquier buffer restante
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.message && parsed.message.content) {
          fullResponse += parsed.message.content;
          res.write(`data: ${JSON.stringify({ type: "chunk", content: parsed.message.content })}\n\n`);
        }
        if (parsed.done) {
          await chatService.saveMessage(sessionId, "assistant", fullResponse, false, model);
          res.write(`data: ${JSON.stringify({ type: "done", model })}\n\n`);
        }
      } catch (e) {
        // ignorar
      }
    }

    res.end();
  } catch (err) {
    console.error("Error en chat:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    res.write(`data: ${JSON.stringify({ type: "error", content: "Error interno del servidor" })}\n\n`);
    res.end();
  }
};

// ============================================================
// Controller: Sessions CRUD
// ============================================================

const createSession = async (req, res) => {
  try {
    const session = await chatService.createSession(req.user.id, req.body.title);
    res.status(201).json(session);
  } catch (err) {
    console.error("Error creando sesión:", err);
    res.status(500).json({ error: "Error al crear sesión" });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await chatService.getSessionsByUser(req.user.id);
    res.json(sessions);
  } catch (err) {
    console.error("Error obteniendo sesiones:", err);
    res.status(500).json({ error: "Error al obtener sesiones" });
  }
};

const getSessionMessages = async (req, res) => {
  try {
    const session = await chatService.getSessionById(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }
    const messages = await chatService.getMessagesBySession(req.params.id);
    res.json({ session, messages });
  } catch (err) {
    console.error("Error obteniendo mensajes:", err);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
};

const deleteSession = async (req, res) => {
  try {
    const deleted = await chatService.deleteSession(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error eliminando sesión:", err);
    res.status(500).json({ error: "Error al eliminar sesión" });
  }
};

// ============================================================
// Controller: Modelos disponibles
// ============================================================

const getModels = async (req, res) => {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    if (!response.ok) {
      return res.status(502).json({ error: "No se pudo conectar con Ollama" });
    }
    const data = await response.json();
    const models = (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at,
    }));
    res.json(models);
  } catch (err) {
    console.error("Error obteniendo modelos:", err);
    res.status(502).json({ error: "Ollama no está disponible. Verifica que esté corriendo." });
  }
};

// ============================================================
// Controller: Page config (greeting + suggestions)
// ============================================================

const getPageContext = (req, res) => {
  const { page } = req.query;
  const config = getPageConfig(page || null);
  res.json(config);
};

module.exports = {
  chat,
  createSession,
  getSessions,
  getSessionMessages,
  deleteSession,
  getModels,
  getPageContext,
};
