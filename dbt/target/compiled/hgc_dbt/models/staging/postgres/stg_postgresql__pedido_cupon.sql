with source as (
    select * from HGC_DW.BRONZE_POSTGRESQL.pedido_cupon
)
select
    id                                    as id_pedido_cupon_nk,
    id_pedido,
    id_cupon,
    monto_descuento
from source