with source as (
    select * from {{ source('bronze_sqlserver', 'asignacion_turnos') }}
)
select
    id_asignacion                         as id_asignacion_nk,
    id_empleado,
    id_turno,
    id_fecha,
    estado
from source