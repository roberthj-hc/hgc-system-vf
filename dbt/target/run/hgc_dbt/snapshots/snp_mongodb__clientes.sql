
      
  
    

create or replace transient table HGC_DW.snapshots.snp_mongodb__clientes
    
    
    
    as (
    

    select *,
        md5(coalesce(cast(id_cliente_nk as varchar ), '')
         || '|' || coalesce(cast(_ab_cdc_updated_at as varchar ), '')
        ) as dbt_scd_id,
        _ab_cdc_updated_at as dbt_updated_at,
        _ab_cdc_updated_at as dbt_valid_from,
        
  
  coalesce(nullif(_ab_cdc_updated_at, _ab_cdc_updated_at), null)
  as dbt_valid_to
from (
        



with source as (
    select * from HGC_DW.BRONZE_MONGODB.clientes
    where _ab_cdc_deleted_at is null
)
select
    cast(id_cliente as int)               as id_cliente_nk,
    nombre,
    email,
    genero,
    segmento,
    cast(celular as varchar)              as celular,
    cast(documento_identidad as bigint)   as documento_identidad,
    cast(fecha_nacimiento as date)        as fecha_nacimiento,
    cast(fecha_registro as timestamp)     as fecha_registro,
    _ab_cdc_updated_at
from source

    ) sbq



    )
;


  
  