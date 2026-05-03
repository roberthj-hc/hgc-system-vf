with source as (
    select * from {{ source('bronze_mariadb', 'transacciones_pago') }}
)
select
    id_pago                               as id_pago_nk,
    id_pedido,
    id_metodo,
    monto,
    estado,
    cast(fecha_pago as timestamp)         as fecha_pago
from source