with source as (
    select * from {{ source('bronze_mysql', 'almacenes') }}
)
select
    id_almacen                            as id_almacen_nk,
    id_sucursal,
    nombre,
    tipo
from source