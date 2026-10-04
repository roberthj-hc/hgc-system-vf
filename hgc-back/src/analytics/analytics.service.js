const { pool } = require('../config/postgres');
const { MODULE_ROLES } = require('./analytics.permissions');
const { numberInRange } = require('./analytics.validation');

async function getReport(module) {
  const { rows } = await pool.query(`SELECT p.payload, r.published_at FROM hgc_analytics.reports p
    JOIN hgc_analytics.releases r USING (release_id) WHERE r.active AND p.module=$1`, [module]);
  if (!rows.length) throw Object.assign(new Error('Todavía no hay una publicación validada. Ejecuta el pipeline de datos.'), { status: 503 });
  return { ...rows[0].payload, published_at: rows[0].published_at };
}
function summarize(rows, key, measures) {
  const map = new Map();
  for (const row of rows) {
    const label = String(row[key]).slice(0, 10);
    const item = map.get(label) || { label };
    for (const measure of measures) item[measure] = (item[measure] || 0) + Number(row[measure] || 0);
    map.set(label, item);
  }
  return [...map.values()].sort((a,b) => a.label.localeCompare(b.label));
}
function viewReport(data, module, { page, pageSize, branch, search }) {
  const branches = data.branches || [...new Map(data.rows.map(r => [r.id_sucursal,
    { id_sucursal: r.id_sucursal, sucursal: r.sucursal || `Sucursal ${r.id_sucursal}` }])).values()];
  let rows = data.rows.filter(r => branch === null || Number(r.id_sucursal) === branch);
  if (search) rows = rows.filter(r => [r.id_cliente, r.producto, r.sucursal, r.estado, r.segmento]
    .some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase())));
  const forecast = (data.forecast || []).filter(r => branch === null || Number(r.id_sucursal) === branch);
  let series = [];
  if (module === 'sales') series = summarize(rows, 'semana', ['ingresos', 'pedidos']);
  if (module === 'profit') series = summarize(rows, 'mes_fecha', ['ingresos_netos', 'costo_op_total', 'utilidad']);
  if (module === 'efficiency') series = rows.map(r => ({label:r.sucursal, costo_op_total:r.costo_op_total, costo_esperado:r.costo_esperado}));
  if (module === 'clv' || module === 'churn') series = [...rows].sort((a,b)=>b[module]-a[module]).slice(0,10)
    .map(r=>({label:`Cliente ${r.id_cliente}`, [module]:r[module]}));
  if (module === 'margin') series = rows.slice(0,10).map(r=>({label:r.producto,margen_actual:r.margen_actual,margen_simulado:r.margen_simulado}));
  const { rows: ignored, forecast: ignoredForecast, source_manifest: manifest, ...metadata } = data;
  return { ...metadata, kpi_scope:'Publicación completa · todas las sucursales', branches, series,
    forecast: summarize(forecast, 'fecha', ['ingresos','pedidos','inferior','superior']),
    rows:rows.slice((page-1)*pageSize, page*pageSize),
    pagination:{page,page_size:pageSize,total:rows.length,pages:Math.ceil(rows.length/pageSize)},
    quality:Object.entries(manifest || {}).map(([table,stats])=>({table,rows:stats.rows})) };
}
async function overview(cargo) {
  const { rows } = await pool.query(`SELECT p.module, p.payload->>'title' AS title,
    p.payload->'model'->>'algorithm' AS algorithm,
    COALESCE(p.payload->'model'->>'cutoff',p.payload->>'cutoff') AS cutoff,
    r.release_id,r.published_at FROM hgc_analytics.reports p
    JOIN hgc_analytics.releases r USING (release_id) WHERE r.active ORDER BY p.module`);
  return { modules:rows.filter(r=>MODULE_ROLES[r.module]?.includes(cargo)) };
}
async function expansionScenario(body) {
  const id=numberInRange(body.id_sucursal,'Sucursal',1,100000);
  const demand=numberInRange(body.demand_factor,'Factor de demanda',.1,2,1);
  const fixed=numberInRange(body.fixed_factor,'Factor de costo fijo',.5,3,1);
  const investment=numberInRange(body.investment,'Inversión',0,100000000,100000);
  const data=await getReport('expansion');
  const analog=data.rows.find(r=>Number(r.id_sucursal)===id);
  if (!analog) throw Object.assign(new Error('Sucursal comparable no disponible'),{status:404});
  const revenue=analog.ingreso_mensual*demand;
  const fixedCost=analog.costo_fijo*fixed;
  const variableCost=revenue*analog.ratio_variable;
  const profit=revenue-fixedCost-variableCost;
  return { revenue, fixed_cost:fixedCost, variable_cost:variableCost, profit,
    break_even:analog.ratio_variable<1 ? fixedCost/(1-analog.ratio_variable) : null,
    payback_months:profit>0 ? investment/profit : null, release_id:data.release_id,
    assumptions:{demand_factor:demand,fixed_factor:fixed,investment},limitations:data.limitations };
}
module.exports = { getReport, viewReport, overview, expansionScenario };
