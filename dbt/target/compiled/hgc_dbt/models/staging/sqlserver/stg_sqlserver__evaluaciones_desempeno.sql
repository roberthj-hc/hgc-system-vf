with source as (
    select * from HGC_DWH.BRONZE_SQLSERVER.evaluaciones_desempeno
)
select
    id_eval                               as id_eval_nk,
    id_empleado,
    puntaje,
    comentarios,
    cast(fecha as date)                   as fecha
from source