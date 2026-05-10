const express = require("express");
const router = express.Router();
const timeSeriesController = require("./time-series.controller");

router.get("/description", timeSeriesController.getDescription);
router.get("/diagnostic", timeSeriesController.getDiagnostic);
router.get("/prediction", timeSeriesController.getPrediction);

module.exports = router;