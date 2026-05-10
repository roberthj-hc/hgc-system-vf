with source as (
    select * from {{ source('bronze_postgres', 'categoria_producto') }}
)
select
    id_categoria                          as id_categoria_nk,
    nombre
from source