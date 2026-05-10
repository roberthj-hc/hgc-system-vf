const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const authService = require("./auth.service");

const CARGO_NIVEL = {
  CEO: "ESTRATEGICO",
  COO: "ESTRATEGICO",
  CFO: "ESTRATEGICO",
  CMO: "ESTRATEGICO",
  GERENTE_REGIONAL: "TACTICO",
  GERENTE_MARKETING: "TACTICO",
  JEFE_LOGISTICA: "TACTICO",
  RRHH_CALIDAD: "TACTICO",
  ADMIN_TIENDA: "OPERATIVO",
  STAFF: "OPERATIVO",
};

const VALID_CARGOS = Object.keys(CARGO_NIVEL);

// Token para el usuario
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      cargo: user.cargo,
      nivel: user.nivel,
    },
    jwtSecret,
    { expiresIn: "24h" }
  );
};

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { nombre, email, password, cargo } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
    }

    const selectedCargo = cargo && VALID_CARGOS.includes(cargo) ? cargo : "STAFF";
    const nivel = CARGO_NIVEL[selectedCargo];
    const existing = await authService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const user = await authService.createUser({
      nombre,
      email,
      password,
      cargo: selectedCargo,
      nivel,
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        cargo: user.cargo,
        nivel: user.nivel,
      },
    });
  } catch (err) {
    console.error("Error en signup:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }
    const user = await authService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const valid = await authService.verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        cargo: user.cargo,
        nivel: user.nivel,
      },
    });
  } catch (err) {
    console.error("Error en login:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const user = await authService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Error en me:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { signup, login, me };
