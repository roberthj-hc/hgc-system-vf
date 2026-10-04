const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Importación de rutas
const timeSeriesRoutes = require("./time-series/time-series.routes");
const authRoutes = require("./auth/auth.routes");
const chatbotRoutes = require("./chatbot/chatbot.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send("API running");
});


// Auth
app.use("/api/auth", authRoutes);

// Time Series
app.use("/api/time-series", timeSeriesRoutes);
app.use("/api/analytics", require("./analytics/analytics.routes"));

// Econometrics (Próximamente)
// app.use("/api/econometrics", econometricsRoutes);

// Predictions (Próximamente)
// app.use("/api/predictions", predictionsRoutes);

// Chatbot
app.use("/api/chatbot", chatbotRoutes);

module.exports = app;