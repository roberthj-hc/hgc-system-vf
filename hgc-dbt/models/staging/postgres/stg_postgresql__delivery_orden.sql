with source as (
    select * from {{ source('bronze_postgres', 'delivery_orden') }}
)
select
    id_delivery                           as id_delivery_nk,
    id_pedido,
    id_plataforma,
    estado,
    cliente_nombre,
    cast(telefono as varchar)             as telefono,
    direccion_entrega,
    codigo_externo,
    costo_envio,
    tiempo_estimado
from source