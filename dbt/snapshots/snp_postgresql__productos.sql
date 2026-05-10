{% snapshot snp_postgresql__productos %}

{{
    config(
        target_schema='snapshots',
        unique_key='id_producto_nk',
        strategy='check',
        check_cols=['precio_base', 'costo_estandar', 'activo', 'tipo', 'id_categoria'],
    )
}}

with source as (
    select * from {{ source('bronze_postgres', 'productos') }}
)
select
    id_producto                           as id_producto_nk,
    id_categoria,
    nombre,
    tipo,
    precio_base,
    costo_estandar,
    activo,
    cast(fecha_creacion as timestamp)     as fecha_creacion
from source

{% endsnapshot %}