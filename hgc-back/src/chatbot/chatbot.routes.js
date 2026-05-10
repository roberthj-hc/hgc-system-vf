const express = require("express");
const router = express.Router();
const chatController = require("./chatbot.controller");
const { verifyToken } = require("../auth/auth.middleware");

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Modelos disponibles en Ollama
router.get("/models", chatController.getModels);

// Contexto de página (greeting + suggestions)
router.get("/page-context", chatController.getPageContext);

// CRUD de sesiones
router.post("/sessions", chatController.createSession);
router.get("/sessions", chatController.getSessions);
router.get("/sessions/:id", chatController.getSessionMessages);
router.delete("/sessions/:id", chatController.deleteSession);

// Chat con streaming
router.post("/chat", chatController.chat);

module.exports = router;
