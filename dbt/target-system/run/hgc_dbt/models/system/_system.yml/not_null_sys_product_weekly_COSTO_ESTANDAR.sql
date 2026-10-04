
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select COSTO_ESTANDAR
from HGC_DWH.SYSTEM.sys_product_weekly
where COSTO_ESTANDAR is null



  
  
      
    ) dbt_internal_test