with source as (
    select * from {{ source('bronze_mysql', 'recetas_bom') }}
)
select
    id_receta                             as id_receta_nk,
    id_producto,
    id_insumo,
    cantidad_requerida
from source