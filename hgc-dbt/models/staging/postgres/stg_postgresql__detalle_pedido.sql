with source as (
    select * from {{ source('bronze_postgres', 'detalle_pedido') }}
)
select
    id_detalle                            as id_detalle_nk,
    id_pedido,
    id_producto,
    cantidad,
    precio_unitario,
    descuento,
    subtotal
from source