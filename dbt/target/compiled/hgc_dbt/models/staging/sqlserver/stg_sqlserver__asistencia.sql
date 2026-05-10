with source as (
    select * from HGC_DW.BRONZE_SQLSERVER.asistencia
)
select
    id_asistencia                         as id_asistencia_nk,
    id_empleado,
    id_fecha,
    cast(hora_entrada as time)            as hora_entrada,
    cast(hora_salida as time)             as hora_salida,
    minutos_atraso
from source