
  
    

create or replace transient table HGC_DW.GOLD.dim_empleado
    
    
    
    as (

with snap as (
    select * from HGC_DW.snapshots.snp_sqlserver__empleados
),
cargos as (
    select id_cargo_nk, nombre, id_departamento from HGC_DW.SILVER.stg_sqlserver__cargos
),
departamentos as (
    select id_departamento_nk, nombre from HGC_DW.SILVER.stg_sqlserver__departamentos
)
select
    row_number() over (order by s.id_empleado_nk, s.dbt_valid_from)         as id_empleado_sk,
    s.id_empleado_nk,
    s.nombre                                                                 as nombre_completo,
    s.documento_identidad,
    s.fecha_ingreso,
    s.salario_base,
    s.tipo_contrato,
    s.estado                                                                 as estado_empleado,
    coalesce(ca.nombre, 'Sin Cargo')                                        as cargo_titulo,
    coalesce(d.nombre, 'Sin Departamento')                                  as departamento_nombre,
    case when coalesce(d.nombre, '') ilike '%Operaci%' then true else false end as es_operativo,
    cast(s.dbt_valid_from as timestamp)                                      as valido_desde,
    cast(coalesce(s.dbt_valid_to, '9999-12-31 23:59:59') as timestamp)      as valido_hasta,
    s.dbt_valid_to is null                                                   as es_actual
from snap s
left join cargos ca      on s.id_cargo         = ca.id_cargo_nk
left join departamentos d on ca.id_departamento = d.id_departamento_nk
    )
;


  