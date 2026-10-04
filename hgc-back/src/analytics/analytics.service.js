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
  if (module === 'profit') series = summarize(rows, 'mes_fecha', ['ingresos_netos', 'costo_total_estimado', 'utilidad']);
  if (module === 'efficiency') series = rows.map(r => ({label:r.sucursal, costo_op_total:r.costo_op_total, costo_esperado:r.costo_esperado}));
  if (module === 'clv' || module === 'churn') series = [...rows].sort((a,b)=>b[module]-a[module]).slice(0,10)
    .map(r=>({label:`Cliente ${r.id_cliente}`, [module]:r[module]}));
  if (module === 'margin') series = rows.slice(0,10).map(r=>({label:r.producto,margen_actual:r.margen_actual,margen_simulado:r.margen_simulado}));
  const { rows: ignored, forecast: ignoredForecast, source_manifest: manifest, ...metadata } = data;
  return { ...metadata, evaluated_at:new Date().toISOString(), kpi_scope:'Publicación completa · todas las sucursales', branches, series,
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
  return { id_sucursal:id, revenue, fixed_cost:fixedCost, variable_cost:variableCost, profit,
    break_even:analog.ratio_variable<1 ? fixedCost/(1-analog.ratio_variable) : null,
    payback_months:profit>0 ? investment/profit : null, release_id:data.release_id,
    assumptions:{demand_factor:demand,fixed_factor:fixed,investment},limitations:data.limitations };
}
async function marginScenario(body) {
  const branch=numberInRange(body.id_sucursal,'Sucursal',1,100000);
  const product=numberInRange(body.id_producto,'Producto',1,10000000);
  const change=numberInRange(body.price_change,'Cambio de precio',-.1,.1,0);
  const elasticity=numberInRange(body.elasticity,'Elasticidad supuesta',-5,0,-1);
  const data=await getReport('margin');
  const item=data.rows.find(r=>Number(r.id_sucursal)===branch && Number(r.id_producto)===product);
  if(!item) throw Object.assign(new Error('Producto no disponible'),{status:404});
  const price=item.precio_actual*(1+change);
  const units=item.unidades_semana*Math.pow(1+change,elasticity);
  return {price,units,contribution:(price-item.costo_unitario)*units,
    contribution_base:item.margen_actual,elasticity,release_id:data.release_id,
    limitations:'La elasticidad es un supuesto ingresado por el usuario. Este escenario no es una recomendación causal del modelo.'};
}
async function customerView(data, module, options) {
  const {branch,search,page,pageSize}=options;
  // Sort column is an internal allowlist; all user filters are bound parameters.
  const metric=module==='clv' ? 'clv' : 'churn';
  const where=`release_id=$1 AND ($2::bigint IS NULL OR id_sucursal=$2)
    AND ($3='' OR id_cliente::text LIKE '%' || $3 || '%' OR payload->>'segmento' ILIKE '%' || $3 || '%')`;
  const values=[data.release_id,branch,search];
  const [result,count,top]=await Promise.all([
    pool.query(`SELECT payload FROM hgc_analytics.customer_predictions WHERE ${where}
      ORDER BY ${metric} DESC,id_cliente LIMIT $4 OFFSET $5`,[...values,pageSize,(page-1)*pageSize]),
    pool.query(`SELECT count(*)::integer AS total FROM hgc_analytics.customer_predictions WHERE ${where}`,values),
    pool.query(`SELECT id_cliente,${metric} AS value FROM hgc_analytics.customer_predictions WHERE ${where}
      ORDER BY ${metric} DESC,id_cliente LIMIT 10`,values),
  ]);
  return {...viewReport(data,module,options),rows:result.rows.map(r=>r.payload),
    series:top.rows.map(r=>({label:`Cliente ${r.id_cliente}`,[metric]:r.value})),
    pagination:{page,page_size:pageSize,total:count.rows[0].total,pages:Math.ceil(count.rows[0].total/pageSize)}};
}
module.exports = { marginScenario, customerView, getReport, viewReport, overview, expansionScenario };
