
  create or replace   view HGC_DWH.SILVER.stg_postgresql__canales_venta
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_POSTGRESQL.canales_venta
)
select
    id_canal                              as id_canal_nk,
    nombre
from source
  );

