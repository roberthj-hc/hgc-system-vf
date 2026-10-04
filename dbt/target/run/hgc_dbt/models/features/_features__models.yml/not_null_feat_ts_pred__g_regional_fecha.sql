
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select fecha
from HGC_DWH.FEATURES.feat_ts_pred__g_regional
where fecha is null



  
  
      
    ) dbt_internal_test