with source as (
    select * from HGC_DW.BRONZE_MYSQL.recetas_bom
)
select
    id_receta                             as id_receta_nk,
    id_producto,
    id_insumo,
    cantidad_requerida
from source