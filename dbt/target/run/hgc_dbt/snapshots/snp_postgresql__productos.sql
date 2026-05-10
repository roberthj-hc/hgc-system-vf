
      
  
    

create or replace transient table HGC_DW.snapshots.snp_postgresql__productos
    
    
    
    as (
    

    select *,
        md5(coalesce(cast(id_producto_nk as varchar ), '')
         || '|' || coalesce(cast(to_timestamp_ntz(convert_timezone('UTC', current_timestamp())) as varchar ), '')
        ) as dbt_scd_id,
        to_timestamp_ntz(convert_timezone('UTC', current_timestamp())) as dbt_updated_at,
        to_timestamp_ntz(convert_timezone('UTC', current_timestamp())) as dbt_valid_from,
        
  
  coalesce(nullif(to_timestamp_ntz(convert_timezone('UTC', current_timestamp())), to_timestamp_ntz(convert_timezone('UTC', current_timestamp()))), null)
  as dbt_valid_to
from (
        



with source as (
    select * from HGC_DW.BRONZE_POSTGRESQL.productos
)
select
    id_producto                           as id_producto_nk,
    id_categoria,
    nombre,
    tipo,
    precio_base,
    costo_estandar,
    activo,
    cast(fecha_creacion as timestamp)     as fecha_creacion
from source

    ) sbq



    )
;


  
  