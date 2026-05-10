

with eval as (
    select * from HGC_DW.SILVER.stg_sqlserver__evaluaciones_desempeno
),
dim_empleado as (
    select id_empleado_sk, id_empleado_nk
    from HGC_DW.GOLD.dim_empleado
    where es_actual = true
)
select
    year(e.fecha)*10000 + month(e.fecha)*100 + day(e.fecha)   as id_fecha_evaluacion_sk,
    de.id_empleado_sk,
    e.id_eval_nk                                               as nro_evaluacion_dd,
    coalesce(e.comentarios, '')                                as comentarios_evaluador_dd,
    cast(e.puntaje as decimal(5,2))                            as puntaje_obtenido,
    case when e.puntaje >= 70 then 1 else 0 end                as indicador_aprobacion
from eval e
left join dim_empleado de on e.id_empleado = de.id_empleado_nk