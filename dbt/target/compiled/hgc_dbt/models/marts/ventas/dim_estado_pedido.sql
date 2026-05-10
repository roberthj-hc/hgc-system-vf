

with source as (select * from HGC_DW.SILVER.stg_postgresql__estado_pedido)
select
    id_estado_nk  as id_estado_sk,
    id_estado_nk,
    nombre        as nombre_estado
from source