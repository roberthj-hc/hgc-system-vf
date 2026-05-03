with source as (
    select * from {{ source('bronze_mysql', 'insumos') }}
)
select
    id_insumo                             as id_insumo_nk,
    nombre,
    unidad_medida,
    costo_unitario,
    activo,
    cast(fecha_creacion as timestamp)     as fecha_creacion
from source