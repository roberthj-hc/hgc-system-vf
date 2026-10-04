
  create or replace   view HGC_DWH.SILVER.stg_mysql__almacenes
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_MYSQL.almacenes
)
select
    id_almacen                            as id_almacen_nk,
    id_sucursal,
    nombre,
    tipo
from source
  );

