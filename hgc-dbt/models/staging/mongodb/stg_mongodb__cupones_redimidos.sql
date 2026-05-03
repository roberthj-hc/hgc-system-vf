with source as (
    select * from {{ source('bronze_mongodb', 'cupones_redimidos') }}
    where _ab_cdc_deleted_at is null
)
select
    cast(id_redencion as int)             as id_redencion_nk,
    cast(id_cupon as int)                 as id_cupon,
    cast(id_pedido as int)                as id_pedido,
    monto_descuento
from source