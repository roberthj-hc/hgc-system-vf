

with mov as (
    select * from HGC_DW.SILVER.stg_mysql__movimientos_inventario
),
dim_tipo as (
    select id_tipo_mov_sk, codigo_tipo_mov_nk from HGC_DW.GOLD.dim_tipo_movimiento
)
select
    year(m.fecha_hora)*10000 + month(m.fecha_hora)*100 + day(m.fecha_hora)   as id_fecha_sk,
    hour(m.fecha_hora)*100 + minute(m.fecha_hora)                             as id_hora_sk,
    m.id_almacen                                                              as id_almacen_sk,
    m.id_insumo                                                               as id_insumo_sk,
    t.id_tipo_mov_sk,
    m.id_mov_nk                                                               as nro_movimiento_dd,
    cast(m.id_pedido as int)                                                  as nro_pedido_asociado_dd,
    coalesce(m.motivo, '')                                                    as motivo_dd,
    m.cantidad                                                                as cantidad_movimiento,
    coalesce(m.costo_unitario, 0)                                            as costo_unitario_movimiento,
    m.cantidad * coalesce(m.costo_unitario, 0)                               as monto_total_movimiento
from mov m
left join dim_tipo t on m.tipo_mov = t.codigo_tipo_mov_nk