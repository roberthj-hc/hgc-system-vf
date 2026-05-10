{{ config(
    materialized='table',
    schema='ECONOMETRICS'
) }}

WITH detalle AS (
    SELECT
        ID_PEDIDO,
        ID_PRODUCTO,
        CANTIDAD,
        PRECIO_UNITARIO,
        DESCUENTO,
        SUBTOTAL
    FROM {{ ref('stg_postgresql__detalle_pedido') }}
),

pedidos AS (
    SELECT
        ID_PEDIDO_NK,
        ID_SUCURSAL,
        ID_CANAL,
        FECHA_HORA::DATE AS FECHA
    FROM {{ ref('stg_postgresql__pedidos') }}
),

base AS (
    SELECT
        p.FECHA,
        p.ID_SUCURSAL,
        p.ID_CANAL,
        d.ID_PRODUCTO,
        d.CANTIDAD,
        d.PRECIO_UNITARIO,
        d.DESCUENTO,
        d.SUBTOTAL
    FROM detalle d
    INNER JOIN pedidos p ON p.ID_PEDIDO_NK = d.ID_PEDIDO
)

SELECT
    DATE_TRUNC('WEEK', FECHA)                            AS SEMANA,
    ID_SUCURSAL,
    ID_PRODUCTO,
    SUM(CANTIDAD)                                        AS UNIDADES,
    SUM(SUBTOTAL)                                        AS INGRESOS,
    SUM(SUBTOTAL) / NULLIF(SUM(CANTIDAD), 0)             AS PRECIO_PROM,
    AVG(DESCUENTO)                                       AS DESCUENTO_PROM,
    COUNT(DISTINCT FECHA)                                AS DIAS_ACTIVOS
FROM base
GROUP BY 1, 2, 3