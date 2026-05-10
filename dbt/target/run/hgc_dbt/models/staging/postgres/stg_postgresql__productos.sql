
  create or replace   view HGC_DW.SILVER.stg_postgresql__productos
  
  
  
  
  as (
    with source as (
    select * from HGC_DW.BRONZE_POSTGRESQL.productos
)
select
    id_producto                           as id_producto_nk,
    id_categoria,
    nombre,
    tipo,
    precio_base,
    costo_estandar,
    activo,
    cast(fecha_creacion as timestamp)     as fecha_creacion
from source
  );

