with source as (
    select * from HGC_DWH.BRONZE_POSTGRESQL.estado_pedido
)
select
    id_estado                             as id_estado_nk,
    nombre
from source