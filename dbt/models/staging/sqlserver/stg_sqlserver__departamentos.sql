with source as (
    select * from {{ source('bronze_sqlserver', 'departamentos') }}
)
select
    id_departamento                       as id_departamento_nk,
    nombre
from source