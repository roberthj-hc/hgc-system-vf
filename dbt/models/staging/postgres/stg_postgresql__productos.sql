with source as (
    select * from {{ source('bronze_postgres', 'productos') }}
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