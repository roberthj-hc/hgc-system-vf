
  create or replace   view HGC_DWH.SILVER.stg_mongodb__cupones_redimidos
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_MONGODB.cupones_redimidos
    where _ab_cdc_deleted_at is null
)
select
    cast(id_redencion as int)             as id_redencion_nk,
    cast(id_cupon as int)                 as id_cupon,
    cast(id_pedido as int)                as id_pedido,
    monto_descuento
from source
  );

