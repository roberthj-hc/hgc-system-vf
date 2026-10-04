
  create or replace   view HGC_DWH.SILVER.stg_mysql__detalle_oc
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_MYSQL.detalle_oc
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

