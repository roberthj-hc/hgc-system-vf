
  create or replace   view HGC_DWH.SILVER.stg_mysql__stock
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_MYSQL.stock
)
select
    id_stock                              as id_stock_nk,
    id_insumo,
    id_almacen,
    cantidad_actual,
    stock_minimo,
    stock_maximo,
    punto_reorden,
    cast(ultima_actualizacion as timestamp) as ultima_actualizacion
from source
  );

