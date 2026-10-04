
  
    

create or replace transient table HGC_DWH.GOLD.dim_metodo_pago
    
    
    
    
    

    as (

with source as (select * from HGC_DWH.SILVER.stg_mariadb__metodos_pago)
select
    id_metodo_nk  as id_metodo_sk,
    id_metodo_nk,
    nombre        as nombre_metodo,
    case id_metodo_nk
        when 1 then 'Efectivo'
        when 2 then 'Tarjeta'
        when 3 then 'Digital'
        when 4 then 'Digital'
        else 'Otro'
    end           as categoria_metodo
from source
    )
;


  