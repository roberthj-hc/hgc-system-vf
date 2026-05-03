{% snapshot snp_mongodb__clientes %}

{{
    config(
        target_schema='snapshots',
        unique_key='id_cliente_nk',
        strategy='timestamp',
        updated_at='_ab_cdc_updated_at',
        invalidate_hard_deletes=true,
    )
}}

with source as (
    select * from {{ source('bronze_mongodb', 'clientes') }}
    where _ab_cdc_deleted_at is null
)
select
    cast(id_cliente as int)               as id_cliente_nk,
    nombre,
    email,
    genero,
    segmento,
    cast(celular as varchar)              as celular,
    cast(documento_identidad as bigint)   as documento_identidad,
    cast(fecha_nacimiento as date)        as fecha_nacimiento,
    cast(fecha_registro as timestamp)     as fecha_registro,
    _ab_cdc_updated_at
from source

{% endsnapshot %}