
  create or replace   view HGC_DWH.SILVER.stg_postgresql__detalle_pedido
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_POSTGRESQL.detalle_pedido
)
select
    id_detalle                            as id_detalle_nk,
    id_pedido,
    id_producto,
    cantidad,
    precio_unitario,
    descuento,
    subtotal
from source
  );

