{% snapshot snp_sqlserver__empleados %}

{{
    config(
        target_schema='snapshots',
        unique_key='id_empleado_nk',
        strategy='check',
        check_cols=['salario_base', 'estado', 'id_cargo', 'id_sucursal', 'tipo_contrato'],
    )
}}

with source as (
    select * from {{ source('bronze_sqlserver', 'empleados') }}
)
select
    id_empleado                           as id_empleado_nk,
    id_sucursal,
    id_cargo,
    nombre,
    tipo_contrato,
    cast(documento_identidad as varchar)  as documento_identidad,
    cast(telefono as varchar)             as telefono,
    salario_base,
    estado,
    cast(fecha_ingreso as date)           as fecha_ingreso
from source

{% endsnapshot %}