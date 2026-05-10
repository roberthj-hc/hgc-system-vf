with source as (
    select * from HGC_DW.BRONZE_MONGODB.campanas
    where _ab_cdc_deleted_at is null
)
select
    cast(id_campana as int)                        as id_campana_nk,
    nombre,
    canal,
    presupuesto,
    split_part(fecha_inicio, '-', 1)::int          as mes_inicio,
    split_part(fecha_inicio, '-', 2)::int          as dia_inicio,
    split_part(fecha_fin, '-', 1)::int             as mes_fin,
    split_part(fecha_fin, '-', 2)::int             as dia_fin
from source