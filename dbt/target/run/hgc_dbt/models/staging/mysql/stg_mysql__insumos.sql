
  create or replace   view HGC_DWH.SILVER.stg_mysql__insumos
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_MYSQL.insumos
)
select
    id_insumo                             as id_insumo_nk,
    nombre,
    unidad_medida,
    costo_unitario,
    activo,
    cast(fecha_creacion as timestamp)     as fecha_creacion
from source
  );

