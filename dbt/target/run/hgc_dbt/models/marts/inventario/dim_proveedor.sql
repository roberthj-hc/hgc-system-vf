
  
    

create or replace transient table HGC_DWH.GOLD.dim_proveedor
    
    
    
    
    

    as (

with source as (select * from HGC_DWH.SILVER.stg_mysql__proveedores)
select
    id_proveedor_nk  as id_proveedor_sk,
    id_proveedor_nk,
    nombre           as nombre_proveedor,
    contacto         as contacto_principal,
    ciudad_origen,
    estado           as estado_proveedor
from source
    )
;


  