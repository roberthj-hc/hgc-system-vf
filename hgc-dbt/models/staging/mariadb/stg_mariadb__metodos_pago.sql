with source as (
    select * from {{ source('bronze_mariadb', 'metodos_pago') }}
)
select
    id_metodo                             as id_metodo_nk,
    nombre
from source