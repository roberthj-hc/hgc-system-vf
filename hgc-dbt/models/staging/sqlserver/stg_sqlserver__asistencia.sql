with source as (
    select * from {{ source('bronze_sqlserver', 'asistencia') }}
)
select
    id_asistencia                         as id_asistencia_nk,
    id_empleado,
    id_fecha,
    cast(hora_entrada as time)            as hora_entrada,
    cast(hora_salida as time)             as hora_salida,
    minutos_atraso
from source