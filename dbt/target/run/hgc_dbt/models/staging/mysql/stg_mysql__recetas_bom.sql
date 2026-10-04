
  create or replace   view HGC_DWH.SILVER.stg_mysql__recetas_bom
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_MYSQL.recetas_bom
)
select
    id_receta                             as id_receta_nk,
    id_producto,
    id_insumo,
    cantidad_requerida
from source
  );

