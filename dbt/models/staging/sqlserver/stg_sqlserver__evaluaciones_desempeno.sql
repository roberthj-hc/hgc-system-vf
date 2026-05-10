with source as (
    select * from {{ source('bronze_sqlserver', 'evaluaciones_desempeno') }}
)
select
    id_eval                               as id_eval_nk,
    id_empleado,
    puntaje,
    comentarios,
    cast(fecha as date)                   as fecha
from source