const { pool } = require("./postgres");

/**
 * Crea las tablas de chat si no existen.
 * Es idempotente: si las tablas ya existen, no las recrea ni elimina datos.
 */
const initChatTables = async () => {
  const query = `
    -- Sesiones de chat por usuario
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      title       VARCHAR(255) DEFAULT 'Nueva conversación',
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    );

    -- Mensajes individuales dentro de cada sesión
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          SERIAL PRIMARY KEY,
      session_id  INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content     TEXT NOT NULL,
      has_image   BOOLEAN DEFAULT FALSE,
      model_used  VARCHAR(50),
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- Índices para búsquedas rápidas
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
  `;

  try {
    await pool.query(query);
    console.log("✅ Tablas 'chat_sessions' y 'chat_messages' verificadas/creadas exitosamente.");
  } catch (err) {
    console.error("❌ Error creando tablas de chat:", err.message);
    throw err;
  }
};

module.exports = { initChatTables };
