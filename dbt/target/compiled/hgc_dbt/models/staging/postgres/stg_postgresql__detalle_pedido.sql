with source as (
    select * from HGC_DW.BRONZE_POSTGRESQL.detalle_pedido
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