
  create or replace   view HGC_DWH.SILVER.stg_mariadb__transacciones_pago
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_MARIADB.transacciones_pago
)
select
    id_pago                               as id_pago_nk,
    id_pedido,
    id_metodo,
    monto,
    estado,
    cast(fecha_pago as timestamp)         as fecha_pago
from source
  );

