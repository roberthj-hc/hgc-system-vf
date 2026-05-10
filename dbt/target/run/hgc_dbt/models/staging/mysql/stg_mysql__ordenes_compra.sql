
  create or replace   view HGC_DW.SILVER.stg_mysql__ordenes_compra
  
  
  
  
  as (
    with source as (
    select * from HGC_DW.BRONZE_MYSQL.ordenes_compra
)
select
    id_oc                                 as id_oc_nk,
    id_sucursal,
    id_proveedor,
    estado,
    total,
    cast(fecha_pedido as date)            as fecha_pedido,
    cast(fecha_recepcion as date)         as fecha_recepcion
from source
  );

