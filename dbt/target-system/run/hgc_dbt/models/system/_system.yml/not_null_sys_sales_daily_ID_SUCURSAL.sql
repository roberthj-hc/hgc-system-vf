
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select ID_SUCURSAL
from HGC_DWH.SYSTEM.sys_sales_daily
where ID_SUCURSAL is null



  
  
      
    ) dbt_internal_test