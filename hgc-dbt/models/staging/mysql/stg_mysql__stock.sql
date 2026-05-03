with source as (
    select * from {{ source('bronze_mysql', 'stock') }}
)
select
    id_stock                              as id_stock_nk,
    id_insumo,
    id_almacen,
    cantidad_actual,
    stock_minimo,
    stock_maximo,
    punto_reorden,
    cast(ultima_actualizacion as timestamp) as ultima_actualizacion
from source