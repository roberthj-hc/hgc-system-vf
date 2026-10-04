

with stock as (
    select * from HGC_DWH.SILVER.stg_mysql__stock
),
insumos as (
    select id_insumo_nk, costo_unitario_historico from HGC_DWH.GOLD.dim_insumo
)
select
    year(s.ultima_actualizacion)*10000
        + month(s.ultima_actualizacion)*100
        + day(s.ultima_actualizacion)                                         as id_fecha_sk,
    s.id_almacen                                                              as id_almacen_sk,
    s.id_insumo                                                               as id_insumo_sk,
    s.cantidad_actual                                                         as cantidad_saldo_final,
    s.cantidad_actual * coalesce(i.costo_unitario_historico, 0)              as valor_inventario_final,
    s.punto_reorden                                                           as cantidad_punto_reorden,
    case when s.cantidad_actual <= s.stock_minimo then 1 else 0 end          as indicador_bajo_stock
from stock s
left join insumos i on s.id_insumo = i.id_insumo_nk