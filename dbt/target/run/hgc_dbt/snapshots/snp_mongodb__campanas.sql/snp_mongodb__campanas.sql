
      
  
    

create or replace transient table HGC_DWH.snapshots.snp_mongodb__campanas
    
    
    
    
    

    as (
    

    select *,
        md5(coalesce(cast(id_campana_nk as varchar ), '')
         || '|' || coalesce(cast(_ab_cdc_updated_at as varchar ), '')
        ) as dbt_scd_id,
        _ab_cdc_updated_at as dbt_updated_at,
        _ab_cdc_updated_at as dbt_valid_from,
        
  
  coalesce(nullif(_ab_cdc_updated_at, _ab_cdc_updated_at), null)
  as dbt_valid_to
from (
        



with source as (
    select * from HGC_DWH.BRONZE_MONGODB.campanas
    where _ab_cdc_deleted_at is null
)
select
    cast(id_campana as int)                        as id_campana_nk,
    nombre,
    canal,
    presupuesto,
    split_part(fecha_inicio, '-', 1)::int          as mes_inicio,
    split_part(fecha_inicio, '-', 2)::int          as dia_inicio,
    split_part(fecha_fin, '-', 1)::int             as mes_fin,
    split_part(fecha_fin, '-', 2)::int             as dia_fin,
    _ab_cdc_updated_at
from source

    ) sbq



    )
;


  
  