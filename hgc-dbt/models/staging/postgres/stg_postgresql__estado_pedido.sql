with source as (
    select * from {{ source('bronze_postgres', 'estado_pedido') }}
)
select
    id_estado                             as id_estado_nk,
    nombre
from source