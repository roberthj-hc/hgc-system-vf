

WITH ventas_mes AS (
    SELECT
        DATE_TRUNC('MONTH', FECHA_HORA::DATE)            AS MES_FECHA,
        ID_SUCURSAL,
        COUNT(DISTINCT ID_PEDIDO_NK)                     AS N_PEDIDOS,
        SUM(TOTAL_NETO)                                  AS INGRESOS_NETOS,
        SUM(TOTAL_DESCUENTO)                             AS DESCUENTOS_TOTAL,
        AVG(TOTAL_NETO)                                  AS TICKET_PROMEDIO
    FROM HGC_DWH.SILVER.stg_postgresql__pedidos
    WHERE ID_ESTADO = 1
    GROUP BY 1, 2
),

unidades_mes AS (
    SELECT
        DATE_TRUNC('MONTH', p.FECHA_HORA::DATE)          AS MES_FECHA,
        p.ID_SUCURSAL,
        SUM(d.CANTIDAD)                                  AS UNIDADES_VENDIDAS,
        COUNT(DISTINCT d.ID_PRODUCTO)                    AS SKU_ACTIVOS
    FROM HGC_DWH.SILVER.stg_postgresql__pedidos p
    INNER JOIN HGC_DWH.SILVER.stg_postgresql__detalle_pedido d
            ON d.ID_PEDIDO = p.ID_PEDIDO_NK
    WHERE p.ID_ESTADO = 1
    GROUP BY 1, 2
),

costos_mes AS (
    SELECT
        DATE_TRUNC('MONTH', FECHA_PAGO)                  AS MES_FECHA,
        ID_SUCURSAL,
        SUM(MONTO)                                       AS COSTO_OP_TOTAL,
        SUM(CASE WHEN CATEGORIA = 'Fijo'     THEN MONTO ELSE 0 END) AS COSTO_FIJO,
        SUM(CASE WHEN CATEGORIA = 'Variable' THEN MONTO ELSE 0 END) AS COSTO_VARIABLE,
        COUNT(DISTINCT SUBCATEGORIA)                     AS N_SUBCATEGORIAS
    FROM HGC_DWH.SILVER.stg_mariadb__costos_operativos
    GROUP BY 1, 2
)

SELECT
    v.MES_FECHA,
    v.ID_SUCURSAL,
    v.N_PEDIDOS,
    v.INGRESOS_NETOS,
    v.DESCUENTOS_TOTAL,
    v.TICKET_PROMEDIO,
    u.UNIDADES_VENDIDAS,
    u.SKU_ACTIVOS,
    c.COSTO_OP_TOTAL,
    c.COSTO_FIJO,
    c.COSTO_VARIABLE,
    c.N_SUBCATEGORIAS
FROM ventas_mes v
LEFT JOIN unidades_mes u
       ON u.MES_FECHA = v.MES_FECHA AND u.ID_SUCURSAL = v.ID_SUCURSAL
LEFT JOIN costos_mes c
       ON c.MES_FECHA = v.MES_FECHA AND c.ID_SUCURSAL = v.ID_SUCURSAL