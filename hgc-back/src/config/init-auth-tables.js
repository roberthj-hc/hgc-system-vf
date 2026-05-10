const { pool } = require("./postgres");

// Crea la tabla de usuarios si no existe
const initAuthTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id          SERIAL PRIMARY KEY,
      nombre      VARCHAR(100) NOT NULL,
      email       VARCHAR(150) UNIQUE NOT NULL,
      password    VARCHAR(255) NOT NULL,
      cargo       VARCHAR(50) NOT NULL DEFAULT 'STAFF',
      nivel       VARCHAR(20) NOT NULL DEFAULT 'OPERATIVO',
      activo      BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log("Tabla 'usuarios' verificada/creada exitosamente.");
  } catch (err) {
    console.error("Error creando tabla 'usuarios':", err.message);
    throw err;
  }
};

module.exports = { initAuthTables };
