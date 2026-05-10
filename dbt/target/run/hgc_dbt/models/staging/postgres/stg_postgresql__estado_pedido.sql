
  create or replace   view HGC_DW.SILVER.stg_postgresql__estado_pedido
  
  
  
  
  as (
    with source as (
    select * from HGC_DW.BRONZE_POSTGRESQL.estado_pedido
)
select
    id_estado                             as id_estado_nk,
    nombre
from source
  );

