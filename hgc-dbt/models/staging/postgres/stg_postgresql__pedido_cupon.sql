with source as (
    select * from {{ source('bronze_postgres', 'pedido_cupon') }}
)
select
    id                                    as id_pedido_cupon_nk,
    id_pedido,
    id_cupon,
    monto_descuento
from source