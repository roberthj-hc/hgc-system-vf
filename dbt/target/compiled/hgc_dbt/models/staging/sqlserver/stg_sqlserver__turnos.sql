with source as (
    select * from HGC_DW.BRONZE_SQLSERVER.turnos
)
select
    id_turno                              as id_turno_nk,
    nombre,
    tipo,
    cast(hora_inicio as time)             as hora_inicio,
    cast(hora_fin as time)                as hora_fin
from source