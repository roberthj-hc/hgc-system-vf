

WITH pedidos_validos AS (
    SELECT
        p.ID_PEDIDO_NK,
        p.ID_SUCURSAL,
        p.ID_CANAL,
        DATE(p.FECHA_HORA) AS FECHA
    FROM HGC_DW.SILVER.stg_postgresql__pedidos p
    JOIN HGC_DW.SILVER.stg_postgresql__estado_pedido ep
      ON p.ID_ESTADO = ep.ID_ESTADO_NK
    WHERE LOWER(ep.NOMBRE) NOT IN ('cancelado', 'anulado')
),

prod_dia AS (
    SELECT
        pe.FECHA,
        d.ID_PRODUCTO,
        SUM(d.CANTIDAD)                                          AS Q,
        SUM(d.SUBTOTAL)                                          AS REVENUE,
        SUM(d.DESCUENTO)                                         AS DESCUENTO_TOTAL,
        SUM(d.PRECIO_UNITARIO * d.CANTIDAD)
            / NULLIF(SUM(d.CANTIDAD), 0)                         AS PRECIO_EFECTIVO,
        COUNT(DISTINCT d.ID_PEDIDO)                              AS NUM_PEDIDOS
    FROM HGC_DW.SILVER.stg_postgresql__detalle_pedido d
    JOIN pedidos_validos pe ON d.ID_PEDIDO = pe.ID_PEDIDO_NK
    GROUP BY 1, 2
)

SELECT
    pd.FECHA,
    pd.ID_PRODUCTO,
    prod.NOMBRE                                                  AS PRODUCTO,
    cat.NOMBRE                                                   AS CATEGORIA,
    prod.TIPO,
    prod.PRECIO_BASE,
    prod.COSTO_ESTANDAR,
    pd.Q,
    pd.REVENUE,
    pd.PRECIO_EFECTIVO,
    pd.DESCUENTO_TOTAL,
    pd.NUM_PEDIDOS,
    pd.DESCUENTO_TOTAL
        / NULLIF(pd.REVENUE + pd.DESCUENTO_TOTAL, 0)             AS DISCOUNT_PCT,
    (prod.PRECIO_BASE - prod.COSTO_ESTANDAR)
        / NULLIF(prod.COSTO_ESTANDAR, 0)                         AS MARKUP_RATIO,
    cal.ES_FERIADO,
    cal.ES_FIN_SEMANA,
    cal.DIA_SEMANA,
    cal.MES,
    cal.ANIO,
    cal.TRIMESTRE
FROM prod_dia pd
JOIN HGC_DW.SILVER.stg_postgresql__productos prod
    ON pd.ID_PRODUCTO = prod.ID_PRODUCTO_NK
LEFT JOIN HGC_DW.SILVER.stg_postgresql__categoria_producto cat
    ON prod.ID_CATEGORIA = cat.ID_CATEGORIA_NK
LEFT JOIN HGC_DW.SILVER.stg_csv__calendario cal
    ON pd.FECHA = cal.FECHA
WHERE pd.Q > 0
  AND pd.PRECIO_EFECTIVO > 0