{% snapshot snp_mongodb__campanas %}

{{
    config(
        target_schema='snapshots',
        unique_key='id_campana_nk',
        strategy='timestamp',
        updated_at='_ab_cdc_updated_at',
        invalidate_hard_deletes=true,
    )
}}

with source as (
    select * from {{ source('bronze_mongodb', 'campanas') }}
    where _ab_cdc_deleted_at is null
)
select
    cast(id_campana as int)                        as id_campana_nk,
    nombre,
    canal,
    presupuesto,
    split_part(fecha_inicio, '-', 1)::int          as mes_inicio,
    split_part(fecha_inicio, '-', 2)::int          as dia_inicio,
    split_part(fecha_fin, '-', 1)::int             as mes_fin,
    split_part(fecha_fin, '-', 2)::int             as dia_fin,
    _ab_cdc_updated_at
from source

{% endsnapshot %}