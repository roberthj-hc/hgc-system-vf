
  
    

create or replace transient table HGC_DW.GOLD.dim_canal_venta
    
    
    
    as (

with source as (select * from HGC_DW.SILVER.stg_postgresql__canales_venta)
select
    id_canal_nk  as id_canal_sk,
    id_canal_nk,
    nombre       as nombre_canal
from source
    )
;


  