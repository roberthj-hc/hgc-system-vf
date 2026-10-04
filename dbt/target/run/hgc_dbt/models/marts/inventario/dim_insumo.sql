
  
    

create or replace transient table HGC_DWH.GOLD.dim_insumo
    
    
    
    
    

    as (

with source as (select * from HGC_DWH.SILVER.stg_mysql__insumos)
select
    id_insumo_nk                       as id_insumo_sk,
    id_insumo_nk,
    nombre                             as nombre_insumo,
    unidad_medida,
    costo_unitario                     as costo_unitario_historico,
    activo,
    cast('2000-01-01' as date)         as valido_desde,
    cast('9999-12-31' as date)         as valido_hasta,
    true                               as es_actual
from source
    )
;


  