with source as (
    select * from HGC_DWH.BRONZE_CSV_EXCEL.calendario
)
select
    cast(id_fecha as int)          as id_fecha_nk,
    cast(fecha as date)            as fecha,
    dia_semana,
    cast(numero_dia as int)        as dia_mes,
    cast(semana as int)            as semana_anio,
    cast(mes as int)               as mes,
    nombre_mes,
    cast(trimestre as int)         as trimestre,
    cast(anio as int)              as anio,
    cast(es_feriado as boolean)    as es_feriado,
    cast(es_fin_semana as boolean) as es_fin_semana
from source