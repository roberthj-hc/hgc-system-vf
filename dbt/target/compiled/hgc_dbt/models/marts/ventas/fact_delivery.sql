

with delivery as (
    select * from HGC_DWH.SILVER.stg_postgresql__delivery_orden
),
pedidos as (
    select id_pedido_nk, id_fecha, id_cliente, id_sucursal, fecha_hora
    from HGC_DWH.SILVER.stg_postgresql__pedidos
),
dim_cliente as (
    select id_cliente_sk, id_cliente_nk
    from HGC_DWH.GOLD.dim_cliente
    where es_actual = true
)
select
    p.id_fecha                                                               as id_fecha_sk,
    p.id_sucursal                                                            as id_sucursal_sk,
    d.id_plataforma                                                          as id_plataforma_sk,
    dc.id_cliente_sk,
    d.id_delivery_nk                                                         as nro_delivery_dd,
    d.id_pedido                                                              as nro_pedido_dd,
    d.codigo_externo                                                         as codigo_externo_plataforma_dd,
    d.estado                                                                 as estado_delivery_dd,
    coalesce(d.costo_envio, 0)                                              as costo_envio,
    coalesce(d.tiempo_estimado, 0)                                          as tiempo_estimado_minutos,
    case when d.estado = 'Entregado' then 1 else 0 end                      as indicador_delivery_completado
from delivery d
inner join pedidos p   on d.id_pedido  = p.id_pedido_nk
left join dim_cliente dc on p.id_cliente = dc.id_cliente_nk