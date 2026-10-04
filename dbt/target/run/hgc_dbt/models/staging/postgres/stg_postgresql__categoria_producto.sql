
  create or replace   view HGC_DWH.SILVER.stg_postgresql__categoria_producto
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_POSTGRESQL.categoria_producto
)
select
    id_categoria                          as id_categoria_nk,
    nombre
from source
  );

