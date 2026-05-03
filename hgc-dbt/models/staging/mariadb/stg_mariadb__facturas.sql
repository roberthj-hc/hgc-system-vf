with source as (
    select * from {{ source('bronze_mariadb', 'facturas') }}
)
select
    id_factura                            as id_factura_nk,
    id_pedido,
    cast(nit_cliente as varchar)          as nit_cliente,
    razon_social,
    monto_total,
    codigo_control,
    nro_autorizacion,
    cast(fecha_emision as timestamp)      as fecha_emision
from source