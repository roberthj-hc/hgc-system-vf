const express = require("express");
const router = express.Router();
const timeSeriesController = require("./time-series.controller");

router.use(require('../auth/auth.middleware').verifyToken);
router.use((req,res,next)=> {
  if (!['CEO','COO','GERENTE_REGIONAL','JEFE_LOGISTICA','ADMIN_TIENDA'].includes(req.user.cargo))
    return res.status(403).json({error:'Sin acceso a series de tiempo'});
  next();
});
router.get("/description", timeSeriesController.getDescription);
router.get("/diagnostic", timeSeriesController.getDiagnostic);
router.get("/prediction", timeSeriesController.getPrediction);

module.exports = router;