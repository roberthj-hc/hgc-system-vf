
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select id_sucursal
from HGC_DWH.FEATURES.feat_ts_desc__g_regional
where id_sucursal is null



  
  
      
    ) dbt_internal_test