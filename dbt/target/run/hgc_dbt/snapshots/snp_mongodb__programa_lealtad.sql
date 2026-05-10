
      
  
    

create or replace transient table HGC_DW.snapshots.snp_mongodb__programa_lealtad
    
    
    
    as (
    

    select *,
        md5(coalesce(cast(id_lealtad_nk as varchar ), '')
         || '|' || coalesce(cast(_ab_cdc_updated_at as varchar ), '')
        ) as dbt_scd_id,
        _ab_cdc_updated_at as dbt_updated_at,
        _ab_cdc_updated_at as dbt_valid_from,
        
  
  coalesce(nullif(_ab_cdc_updated_at, _ab_cdc_updated_at), null)
  as dbt_valid_to
from (
        



with source as (
    select * from HGC_DW.BRONZE_MONGODB.programa_lealtad
    where _ab_cdc_deleted_at is null
)
select
    cast(id_lealtad as int)                as id_lealtad_nk,
    cast(id_cliente as int)                as id_cliente,
    nivel,
    cast(puntos_acumulados as int)         as puntos_acumulados,
    cast(fecha_actualizacion as timestamp) as fecha_actualizacion,
    _ab_cdc_updated_at
from source

    ) sbq



    )
;


  
  