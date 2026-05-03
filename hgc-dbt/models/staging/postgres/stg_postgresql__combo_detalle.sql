with source as (
    select * from {{ source('bronze_postgres', 'combo_detalle') }}
)
select
    id_combo_detalle                      as id_combo_detalle_nk,
    id_producto_combo,
    id_producto_item,
    cantidad
from source