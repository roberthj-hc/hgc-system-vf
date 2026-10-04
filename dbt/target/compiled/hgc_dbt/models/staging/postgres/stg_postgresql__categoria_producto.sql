with source as (
    select * from HGC_DWH.BRONZE_POSTGRESQL.categoria_producto
)
select
    id_categoria                          as id_categoria_nk,
    nombre
from source