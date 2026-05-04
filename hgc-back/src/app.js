const express = require("express");
const cors = require("cors");

const timeSeriesRoutes = require("./time-series/controller");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

// Time Series
app.use("/api/time-series", timeSeriesRoutes);

module.exports = app;