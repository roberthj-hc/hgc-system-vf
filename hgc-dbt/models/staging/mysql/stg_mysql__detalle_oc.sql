with source as (
    select * from {{ source('bronze_mysql', 'detalle_oc') }}
)
select
    id_detalle_oc                         as id_detalle_oc_nk,
    id_oc,
    id_insumo,
    cantidad,
    precio_unitario,
    subtotal
from source