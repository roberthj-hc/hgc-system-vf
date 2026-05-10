
      
  
    

create or replace transient table HGC_DW.snapshots.snp_mongodb__cupones
    
    
    
    as (
    

    select *,
        md5(coalesce(cast(id_cupon_nk as varchar ), '')
         || '|' || coalesce(cast(_ab_cdc_updated_at as varchar ), '')
        ) as dbt_scd_id,
        _ab_cdc_updated_at as dbt_updated_at,
        _ab_cdc_updated_at as dbt_valid_from,
        
  
  coalesce(nullif(_ab_cdc_updated_at, _ab_cdc_updated_at), null)
  as dbt_valid_to
from (
        



with source as (
    select * from HGC_DW.BRONZE_MONGODB.cupones
    where _ab_cdc_deleted_at is null
)
select
    cast(id_cupon as int)                 as id_cupon_nk,
    cast(id_campana as int)               as id_campana,
    codigo,
    tipo_descuento,
    valor,
    cast(activo as boolean)               as activo,
    _ab_cdc_updated_at
from source

    ) sbq



    )
;


  
  