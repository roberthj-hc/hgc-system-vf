const express = require("express");
const router = express.Router();

const service = require("./service");

// GET /api/time-series
router.get("/", (req, res) => {
  const data = service.getTimeSeries();
  res.json(data);
});

// GET /api/time-series/sucursal/:name
router.get("/sucursal/:name", (req, res) => {
  const data = service.getBySucursal(req.params.name);
  res.json(data);
});

module.exports = router;