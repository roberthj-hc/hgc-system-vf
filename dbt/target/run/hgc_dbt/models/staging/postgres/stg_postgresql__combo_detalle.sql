
  create or replace   view HGC_DW.SILVER.stg_postgresql__combo_detalle
  
  
  
  
  as (
    with source as (
    select * from HGC_DW.BRONZE_POSTGRESQL.combo_detalle
)
select
    id_combo_detalle                      as id_combo_detalle_nk,
    id_producto_combo,
    id_producto_item,
    cantidad
from source
  );

