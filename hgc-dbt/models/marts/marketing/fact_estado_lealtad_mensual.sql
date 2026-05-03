{{ config(materialized='table') }}

with lealtad as (
    select * from {{ ref('stg_mongodb__programa_lealtad') }}
),
dim_cliente as (
    select id_cliente_sk, id_cliente_nk
    from {{ ref('dim_cliente') }}
    where es_actual = true
),
base as (
    select
        id_cliente,
        nivel,
        puntos_acumulados,
        year(fecha_actualizacion)  as anio,
        month(fecha_actualizacion) as mes,
        year(fecha_actualizacion)*10000
            + month(fecha_actualizacion)*100
            + day(last_day(fecha_actualizacion::date)) as id_fecha_cierre_mes,
        row_number() over (
            partition by id_cliente,
                         year(fecha_actualizacion),
                         month(fecha_actualizacion)
            order by fecha_actualizacion desc
        ) as rn
    from lealtad
)
select
    b.id_fecha_cierre_mes                                                        as id_fecha_cierre_mes_sk,
    dc.id_cliente_sk,
    b.nivel                                                                      as nivel_lealtad_dd,
    b.puntos_acumulados                                                          as puntos_acumulados_historicos,
    b.puntos_acumulados                                                          as puntos_disponibles_cierre,
    coalesce(
        b.puntos_acumulados - lag(b.puntos_acumulados) over (
            partition by b.id_cliente order by b.anio, b.mes
        ), 0
    )                                                                            as variacion_puntos_mes
from base b
left join dim_cliente dc on b.id_cliente = dc.id_cliente_nk
where b.rn = 1