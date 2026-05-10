
  create or replace   view HGC_DW.SILVER.stg_mysql__detalle_oc
  
  
  
  
  as (
    with source as (
    select * from HGC_DW.BRONZE_MYSQL.detalle_oc
)
select
    id_detalle_oc                         as id_detalle_oc_nk,
    id_oc,
    id_insumo,
    cantidad,
    precio_unitario,
    subtotal
from source
  );

