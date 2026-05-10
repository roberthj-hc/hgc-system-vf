const { pool } = require("../config/postgres");

// ============================================================
// Sessions
// ============================================================

/**
 * Crea una nueva sesión de chat para el usuario dado.
 */
const createSession = async (userId, title = "Nueva conversación") => {
  const result = await pool.query(
    `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING *`,
    [userId, title]
  );
  return result.rows[0];
};

/**
 * Lista todas las sesiones de un usuario, ordenadas por última actualización.
 */
const getSessionsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT cs.*,
            (SELECT COUNT(*) FROM chat_messages cm WHERE cm.session_id = cs.id) AS message_count,
            (SELECT cm.content FROM chat_messages cm WHERE cm.session_id = cs.id ORDER BY cm.created_at DESC LIMIT 1) AS last_message
     FROM chat_sessions cs
     WHERE cs.user_id = $1
     ORDER BY cs.updated_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Obtiene una sesión por ID, verificando que pertenezca al usuario.
 */
const getSessionById = async (sessionId, userId) => {
  const result = await pool.query(
    `SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Actualiza el título de una sesión.
 */
const updateSessionTitle = async (sessionId, title) => {
  await pool.query(
    `UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2`,
    [title, sessionId]
  );
};

/**
 * Elimina una sesión y todos sus mensajes (CASCADE).
 */
const deleteSession = async (sessionId, userId) => {
  const result = await pool.query(
    `DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
    [sessionId, userId]
  );
  return result.rowCount > 0;
};

// ============================================================
// Messages
// ============================================================

/**
 * Guarda un mensaje en la sesión.
 */
const saveMessage = async (sessionId, role, content, hasImage = false, modelUsed = null) => {
  const result = await pool.query(
    `INSERT INTO chat_messages (session_id, role, content, has_image, model_used)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [sessionId, role, content, hasImage, modelUsed]
  );

  // Actualizar timestamp de la sesión
  await pool.query(
    `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`,
    [sessionId]
  );

  return result.rows[0];
};

/**
 * Obtiene todos los mensajes de una sesión ordenados cronológicamente.
 */
const getMessagesBySession = async (sessionId) => {
  const result = await pool.query(
    `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId]
  );
  return result.rows;
};

/**
 * Obtiene los últimos N mensajes de una sesión para contexto.
 */
const getContextMessages = async (sessionId, limit = 20) => {
  const result = await pool.query(
    `SELECT role, content FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [sessionId, limit]
  );
  // Invertir para orden cronológico
  return result.rows.reverse();
};

/**
 * Cuenta los mensajes de una sesión.
 */
const countMessages = async (sessionId) => {
  const result = await pool.query(
    `SELECT COUNT(*) AS count FROM chat_messages WHERE session_id = $1`,
    [sessionId]
  );
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  createSession,
  getSessionsByUser,
  getSessionById,
  updateSessionTitle,
  deleteSession,
  saveMessage,
  getMessagesBySession,
  getContextMessages,
  countMessages,
};
