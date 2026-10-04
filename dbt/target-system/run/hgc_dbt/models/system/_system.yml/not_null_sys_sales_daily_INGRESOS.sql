
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select INGRESOS
from HGC_DWH.SYSTEM.sys_sales_daily
where INGRESOS is null



  
  
      
    ) dbt_internal_test