
  
    

create or replace transient table HGC_DW.GOLD.fact_compras_detalle
    
    
    
    as (

with oc as (
    select * from HGC_DW.SILVER.stg_mysql__ordenes_compra
),
detalle_oc as (
    select * from HGC_DW.SILVER.stg_mysql__detalle_oc
)
select
    year(o.fecha_pedido)*10000 + month(o.fecha_pedido)*100 + day(o.fecha_pedido)            as id_fecha_pedido_sk,
    coalesce(
        year(o.fecha_recepcion)*10000 + month(o.fecha_recepcion)*100 + day(o.fecha_recepcion),
        year(o.fecha_pedido)*10000   + month(o.fecha_pedido)*100   + day(o.fecha_pedido)
    )                                                                                        as id_fecha_recepcion_esperada_sk,
    o.id_sucursal                                                                            as id_sucursal_sk,
    o.id_proveedor                                                                           as id_proveedor_sk,
    d.id_insumo                                                                              as id_insumo_sk,
    o.id_oc_nk                                                                              as nro_orden_compra_dd,
    d.id_detalle_oc_nk                                                                      as nro_linea_oc_dd,
    o.estado                                                                                as estado_oc_dd,
    cast(d.cantidad as decimal(18,4))                                                       as cantidad_comprada,
    d.precio_unitario                                                                       as precio_unitario_compra,
    d.subtotal                                                                              as monto_subtotal_compra
from detalle_oc d
inner join oc o on d.id_oc = o.id_oc_nk
    )
;


  