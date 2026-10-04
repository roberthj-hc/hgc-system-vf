
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select COSTO_OP_TOTAL
from HGC_DWH.SYSTEM.sys_branch_monthly
where COSTO_OP_TOTAL is null



  
  
      
    ) dbt_internal_test