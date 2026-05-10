
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select fecha_inicio_semana
from HGC_DW.FEATURES.feat_ts_desc__g_regional
where fecha_inicio_semana is null



  
  
      
    ) dbt_internal_test