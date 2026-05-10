with source as (
    select * from {{ source('bronze_postgres', 'canales_venta') }}
)
select
    id_canal                              as id_canal_nk,
    nombre
from source