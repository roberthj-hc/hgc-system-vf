
  create or replace   view HGC_DW.SILVER.stg_mariadb__costos_operativos
  
  
  
  
  as (
    with source as (
    select * from HGC_DW.BRONZE_MARIADB.costos_operativos
)
select
    id_costo                              as id_costo_nk,
    id_sucursal,
    categoria,
    subcategoria,
    descripcion,
    monto,
    cast(fecha_pago as date)              as fecha_pago
from source
  );

