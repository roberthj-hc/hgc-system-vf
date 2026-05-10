

with source as (
    select * from HGC_DW.SILVER.stg_csv__calendario
)
select
    id_fecha_nk                     as id_fecha_sk,
    fecha,
    dia_semana,
    dayofweekiso(fecha)             as numero_dia_semana,
    dia_mes,
    dayofyear(fecha)                as dia_anio,
    semana_anio,
    mes,
    nombre_mes,
    trimestre,
    anio,
    es_feriado,
    es_fin_semana
from source