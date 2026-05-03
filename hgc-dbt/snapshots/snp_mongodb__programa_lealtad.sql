{% snapshot snp_mongodb__programa_lealtad %}

{{
    config(
        target_schema='snapshots',
        unique_key='id_lealtad_nk',
        strategy='timestamp',
        updated_at='_ab_cdc_updated_at',
        invalidate_hard_deletes=true,
    )
}}

with source as (
    select * from {{ source('bronze_mongodb', 'programa_lealtad') }}
    where _ab_cdc_deleted_at is null
)
select
    cast(id_lealtad as int)                as id_lealtad_nk,
    cast(id_cliente as int)                as id_cliente,
    nivel,
    cast(puntos_acumulados as int)         as puntos_acumulados,
    cast(fecha_actualizacion as timestamp) as fecha_actualizacion,
    _ab_cdc_updated_at
from source

{% endsnapshot %}