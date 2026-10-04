const { pool } = require('../config/postgres');
const getDescriptionData = async () => {
  const {rows}=await pool.query(`SELECT date_trunc('week',fecha)::date AS fecha_inicio_semana,
    id_sucursal,sucursal,ciudad,SUM(ingresos) AS ingresos_semana,SUM(pedidos) AS pedidos_semana,
    SUM(ingresos)/NULLIF(SUM(pedidos),0) AS ticket_promedio_semana
    FROM hgc_analytics.sys_sales_daily
    WHERE fecha >= (SELECT MAX(fecha)-INTERVAL '1 year' FROM hgc_analytics.sys_sales_daily)
    GROUP BY 1,2,3,4 ORDER BY 1,2`);
  return rows;
};
const getDiagnosticData = async () => {
  const {rows}=await pool.query(`WITH history AS (
    SELECT fecha,id_sucursal,sucursal,ingresos,pedidos,
      AVG(ingresos) OVER (PARTITION BY id_sucursal ORDER BY fecha ROWS BETWEEN 28 PRECEDING AND 1 PRECEDING) AS media_previa,
      STDDEV(ingresos) OVER (PARTITION BY id_sucursal ORDER BY fecha ROWS BETWEEN 28 PRECEDING AND 1 PRECEDING) AS desviacion_previa
    FROM hgc_analytics.sys_sales_daily)
    SELECT *, CASE WHEN ingresos < media_previa-2*desviacion_previa THEN 'CAIDA_ANOMALA'
      WHEN ingresos > media_previa+2*desviacion_previa THEN 'PICO_ANOMALO' ELSE 'NORMAL' END AS tipo_anomalia
    FROM history WHERE fecha >= (SELECT MAX(fecha)-INTERVAL '90 days' FROM history) ORDER BY fecha,id_sucursal`);
  return rows;
};
const getPredictionData = async () => {
  const {rows}=await pool.query(`SELECT p.payload->'forecast' AS forecast FROM hgc_analytics.reports p
    JOIN hgc_analytics.releases r USING(release_id) WHERE r.active AND p.module='sales'`);
  return rows[0]?.forecast || [];
};
module.exports = { getDescriptionData, getDiagnosticData, getPredictionData };
