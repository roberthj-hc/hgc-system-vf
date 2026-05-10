
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select fecha
from HGC_DW.FEATURES.feat_ts_diag__g_regional
where fecha is null



  
  
      
    ) dbt_internal_test