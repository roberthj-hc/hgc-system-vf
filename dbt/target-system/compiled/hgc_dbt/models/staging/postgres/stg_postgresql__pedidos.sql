with source as (
    select * from HGC_DWH.BRONZE_POSTGRESQL.pedidos
)
select
    id_pedido                             as id_pedido_nk,
    id_sucursal,
    id_cliente,
    id_canal,
    id_fecha,
    id_estado,
    id_empleado_cajero,
    total_bruto,
    total_descuento,
    impuesto,
    propina,
    total_neto,
    cast(observaciones as varchar)        as observaciones,
    cast(fecha_hora as timestamp)         as fecha_hora,
    cast(created_at as timestamp)         as created_at
from source