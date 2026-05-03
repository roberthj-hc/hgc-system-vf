{{ config(materialized='table') }}

with pedidos as (
    select * from {{ ref('stg_postgresql__pedidos') }}
),
detalle as (
    select * from {{ ref('stg_postgresql__detalle_pedido') }}
),
dim_producto as (
    select id_producto_sk, id_producto_nk
    from {{ ref('dim_producto') }}
    where es_actual = true
),
dim_cliente as (
    select id_cliente_sk, id_cliente_nk
    from {{ ref('dim_cliente') }}
    where es_actual = true
),
dim_empleado as (
    select id_empleado_sk, id_empleado_nk
    from {{ ref('dim_empleado') }}
    where es_actual = true
)
select
    p.id_fecha                                                               as id_fecha_sk,
    hour(p.fecha_hora) * 100 + minute(p.fecha_hora)                         as id_hora_sk,
    p.id_sucursal                                                            as id_sucursal_sk,
    dp.id_producto_sk,
    dc.id_cliente_sk,
    de.id_empleado_sk                                                        as id_empleado_cajero_sk,
    p.id_canal                                                               as id_canal_sk,
    p.id_estado                                                              as id_estado_pedido_sk,
    p.id_pedido_nk                                                           as nro_pedido_dd,
    d.id_detalle_nk                                                          as nro_linea_dd,
    coalesce(p.observaciones, '')                                            as observaciones_pedido_dd,
    d.cantidad                                                               as cantidad_vendida,
    d.precio_unitario                                                        as precio_unitario_venta,
    d.subtotal                                                               as monto_subtotal_bruto,
    coalesce(d.descuento, 0)                                                 as monto_descuento_linea,
    d.subtotal - coalesce(d.descuento, 0)                                   as monto_subtotal_neto,
    round(coalesce(p.impuesto, 0) * d.subtotal / nullif(p.total_bruto, 0), 4) as monto_impuesto_prorrateado,
    round(coalesce(p.propina,  0) * d.subtotal / nullif(p.total_bruto, 0), 4) as monto_propina_prorrateada
from detalle d
inner join pedidos p     on d.id_pedido   = p.id_pedido_nk
left join dim_producto dp on d.id_producto = dp.id_producto_nk
left join dim_cliente  dc on p.id_cliente  = dc.id_cliente_nk
left join dim_empleado de on p.id_empleado_cajero = de.id_empleado_nk