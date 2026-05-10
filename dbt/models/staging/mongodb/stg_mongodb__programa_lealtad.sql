with source as (
    select * from {{ source('bronze_mongodb', 'programa_lealtad') }}
    where _ab_cdc_deleted_at is null
)
select
    cast(id_lealtad as int)               as id_lealtad_nk,
    cast(id_cliente as int)               as id_cliente,
    nivel,
    cast(puntos_acumulados as int)        as puntos_acumulados,
    cast(fecha_actualizacion as timestamp) as fecha_actualizacion
from source