const { pool } = require("../config/postgres");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

// Busca un usuario por email
const findByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM usuarios WHERE email = $1 AND activo = true",
    [email]
  );
  return result.rows[0] || null;
};

//Busca un usuario por ID
const findById = async (id) => {
  const result = await pool.query(
    "SELECT id, nombre, email, cargo, nivel, created_at FROM usuarios WHERE id = $1 AND activo = true",
    [id]
  );
  return result.rows[0] || null;
};

//Crea un nuevo usuario con password hasheado
const createUser = async ({ nombre, email, password, cargo, nivel }) => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO usuarios (nombre, email, password, cargo, nivel)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nombre, email, cargo, nivel, created_at`,
    [nombre, email, hashedPassword, cargo, nivel]
  );

  return result.rows[0];
};

//Verifica la contraseña de un usuario
const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  verifyPassword,
};
