const timeSeriesService = require("./time-series.service");

const getDescription = async (req, res) => {
  try {
    const data = await timeSeriesService.getDescriptionData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error en getDescription:", error);
    res.status(500).json({ error: "Error al obtener los datos de descripción de series de tiempo" });
  }
};

const getDiagnostic = async (req, res) => {
  try {
    const data = await timeSeriesService.getDiagnosticData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error en getDiagnostic:", error);
    res.status(500).json({ error: "Error al obtener los datos de diagnóstico de series de tiempo" });
  }
};

const getPrediction = async (req, res) => {
  try {
    const data = await timeSeriesService.getPredictionData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error en getDiagnostic:", error);
    res.status(500).json({ error: "Error al obtener los datos de predicción de series de tiempo" });
  }
};

module.exports = {
  getDescription,
  getDiagnostic,
  getPrediction,
};