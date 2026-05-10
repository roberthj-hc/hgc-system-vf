const { Pool } = require("pg");
const { db } = require("./env");

const pool = new Pool({
  user: db.user,
  host: db.host,
  database: db.database,
  password: db.password,
  port: db.port,
});

const connectPostgres = async () => {
  try {
    console.log("Intentando conectar a PostgreSQL...");
    const client = await pool.connect();
    console.log(`Conectado exitosamente a la base de datos: ${db.database}`);
    client.release();
    return true;
  } catch (err) {
    console.error("Error conectando a PostgreSQL:", err.message);
    throw err;
  }
};

module.exports = {
  pool,
  connectPostgres
};