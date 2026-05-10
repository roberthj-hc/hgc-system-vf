const { pool } = require("../config/postgres");

const getDescriptionData = async () => {
  const query = `
    SELECT * 
    FROM FEAT_TS_DESC__G_REGIONAL;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

const getDiagnosticData = async () => {
  const query = `
    SELECT * 
    FROM FEAT_TS_DIAG__G_REGIONAL
    ORDER BY FECHA ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

const getPredictionData = async () => {
  const query = `
    SELECT * 
    FROM FEAT_TS_PRED__G_REGIONAL;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

module.exports = {
  getDescriptionData,
  getDiagnosticData,
  getPredictionData,
};