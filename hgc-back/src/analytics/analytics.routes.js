const express = require('express');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeModule } = require('./analytics.permissions');
const { queryOptions } = require('./analytics.validation');
const service = require('./analytics.service');
const router = express.Router();
router.use(verifyToken);
router.get('/overview', async (req,res,next) => {
  try { res.json(await service.overview(req.user.cargo)); } catch(error) { next(error); }
});
router.get('/:module', authorizeModule, async (req,res,next) => {
  try {
    const options=queryOptions(req.query);
    res.set('Cache-Control','private, no-store');
    res.json(service.viewReport(await service.getReport(req.params.module),req.params.module,options));
  } catch(error) { next(error); }
});
router.post('/:module/scenario', authorizeModule, async (req,res,next) => {
  if(req.params.module!=='expansion') return res.status(404).json({error:'Escenario no disponible'});
  try { res.json(await service.expansionScenario(req.body)); } catch(error) { next(error); }
});
router.use((error,req,res,next) => {
  const unavailable = ['42P01','3F000','ECONNREFUSED'].includes(error.code);
  const status = error.status || (unavailable ? 503 : 500);
  if(status>=500) console.error('Analytics request failed:',error.code || error.name);
  res.status(status).json({error: status===500 ? 'No se pudo consultar la publicación analítica.' :
    unavailable ? 'Datos analíticos no disponibles. Ejecuta el pipeline de actualización.' : error.message});
});
module.exports = router;
