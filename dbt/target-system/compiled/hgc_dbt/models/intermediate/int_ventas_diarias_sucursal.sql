

WITH pedidos_completados AS (
    SELECT
        p.ID_PEDIDO_NK,
        p.ID_SUCURSAL,
        p.ID_CANAL,
        p.ID_FECHA,
        p.FECHA_HORA,
        p.TOTAL_NETO,
        p.TOTAL_DESCUENTO,
        p.PROPINA
    FROM HGC_DWH.SILVER.stg_postgresql__pedidos p
    WHERE p.ID_ESTADO = 1
),

detalle_agg AS (
    SELECT
        d.ID_PEDIDO,
        COUNT(*) AS cantidad_items,
        SUM(d.CANTIDAD) AS cantidad_productos
    FROM HGC_DWH.SILVER.stg_postgresql__detalle_pedido d
    GROUP BY d.ID_PEDIDO
)

SELECT
    p.FECHA_HORA::DATE AS fecha,
    p.ID_SUCURSAL AS id_sucursal,
    s.NOMBRE AS sucursal,
    s.CIUDAD AS ciudad,
    s.TIPO_FORMATO AS tipo_formato,
    c.NOMBRE AS canal_venta,
    cal.DIA_SEMANA AS dia_semana,
    cal.DIA_MES AS dia_mes,
    cal.SEMANA_ANIO AS semana_anio,
    cal.MES AS mes,
    cal.NOMBRE_MES AS nombre_mes,
    cal.TRIMESTRE AS trimestre,
    cal.ANIO AS anio,
    cal.ES_FERIADO AS es_feriado,
    cal.ES_FIN_SEMANA AS es_fin_semana,
    COUNT(*) AS num_pedidos,
    SUM(p.TOTAL_NETO) AS ingresos_netos,
    SUM(p.TOTAL_DESCUENTO) AS total_descuentos,
    AVG(p.TOTAL_NETO) AS ticket_promedio,
    SUM(da.cantidad_productos) AS total_unidades_vendidas,
    SUM(da.cantidad_items) AS total_lineas_pedido
FROM pedidos_completados p
JOIN HGC_DWH.SILVER.stg_csv__sucursales s
    ON p.ID_SUCURSAL = s.ID_SUCURSAL_NK
JOIN HGC_DWH.SILVER.stg_postgresql__canales_venta c
    ON p.ID_CANAL = c.ID_CANAL_NK
JOIN HGC_DWH.SILVER.stg_csv__calendario cal
    ON p.ID_FECHA = cal.ID_FECHA_NK
LEFT JOIN detalle_agg da
    ON p.ID_PEDIDO_NK = da.ID_PEDIDO
GROUP BY
    p.FECHA_HORA::DATE,
    p.ID_SUCURSAL,
    s.NOMBRE,
    s.CIUDAD,
    s.TIPO_FORMATO,
    c.NOMBRE,
    cal.DIA_SEMANA,
    cal.DIA_MES,
    cal.SEMANA_ANIO,
    cal.MES,
    cal.NOMBRE_MES,
    cal.TRIMESTRE,
    cal.ANIO,
    cal.ES_FERIADO,
    cal.ES_FIN_SEMANA