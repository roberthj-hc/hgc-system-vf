{{ config(materialized='table') }}

with asistencia as (
    select * from {{ ref('stg_sqlserver__asistencia') }}
),
asignaciones as (
    select id_empleado, id_fecha, id_turno, estado
    from {{ ref('stg_sqlserver__asignacion_turnos') }}
),
turnos as (
    select id_turno_nk, hora_inicio_estandar, hora_fin_estandar
    from {{ ref('dim_turno') }}
),
dim_empleado as (
    select id_empleado_sk, id_empleado_nk
    from {{ ref('dim_empleado') }}
    where es_actual = true
)
select
    a.id_fecha                                                                  as id_fecha_sk,
    de.id_empleado_sk,
    coalesce(asig.id_turno, -1)                                                 as id_turno_sk,
    coalesce(hour(a.hora_entrada) * 100 + minute(a.hora_entrada), 0)            as id_hora_entrada_sk,
    coalesce(hour(a.hora_salida)  * 100 + minute(a.hora_salida),  0)            as id_hora_salida_sk,
    a.id_asistencia_nk                                                          as nro_asistencia_dd,
    coalesce(asig.estado, 'Sin Asignación')                                     as estado_asignacion_dd,
    coalesce(a.minutos_atraso, 0)                                               as minutos_atraso_entrada,
    case
        when a.hora_salida is not null
         and t.hora_fin_estandar is not null
         and a.hora_salida < t.hora_fin_estandar
        then datediff('minute', a.hora_salida, t.hora_fin_estandar)
        else 0
    end                                                                         as minutos_salida_anticipada,
    case
        when a.hora_entrada is not null and a.hora_salida is not null
         and datediff('minute', a.hora_entrada, a.hora_salida) > 0
        then round(datediff('minute', a.hora_entrada, a.hora_salida) / 60.0, 2)
        else 0
    end                                                                         as horas_trabajadas_reales,
    0                                                                           as indicador_ausencia,
    case when coalesce(a.minutos_atraso, 0) = 0 then 1 else 0 end              as indicador_puntualidad
from asistencia a
left join dim_empleado de  on a.id_empleado = de.id_empleado_nk
left join asignaciones asig on a.id_empleado = asig.id_empleado
                           and a.id_fecha    = asig.id_fecha
left join turnos t         on asig.id_turno  = t.id_turno_nk