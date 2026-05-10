const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { verifyToken } = require("./auth.middleware");

// Rutas públicas
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Rutas protegidas
router.get("/me", verifyToken, authController.me);

module.exports = router;
