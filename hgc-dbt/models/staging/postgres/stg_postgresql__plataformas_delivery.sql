with source as (
    select * from {{ source('bronze_postgres', 'plataformas_delivery') }}
)
select
    id_plataforma                         as id_plataforma_nk,
    nombre
from source