
  
    

create or replace transient table HGC_DWH.GOLD.dim_estado_pedido
    
    
    
    
    

    as (

with source as (select * from HGC_DWH.SILVER.stg_postgresql__estado_pedido)
select
    id_estado_nk  as id_estado_sk,
    id_estado_nk,
    nombre        as nombre_estado
from source
    )
;


  