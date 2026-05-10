with source as (
    select * from {{ source('bronze_sqlserver', 'cargos') }}
)
select
    id_cargo                              as id_cargo_nk,
    id_departamento,
    nombre
from source