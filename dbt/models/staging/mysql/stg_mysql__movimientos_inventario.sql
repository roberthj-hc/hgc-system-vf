with source as (
    select * from {{ source('bronze_mysql', 'movimientos_inventario') }}
)
select
    id_mov                                as id_mov_nk,
    id_insumo,
    id_almacen,
    cast(id_pedido as int)                as id_pedido,
    tipo_mov,
    motivo,
    cantidad,
    costo_unitario,
    cast(fecha_hora as timestamp)         as fecha_hora
from source