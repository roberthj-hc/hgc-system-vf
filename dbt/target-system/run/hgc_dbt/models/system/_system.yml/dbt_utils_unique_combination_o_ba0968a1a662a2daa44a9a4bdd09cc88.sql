
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  





with validation_errors as (

    select
        ID_SUCURSAL, FECHA
    from HGC_DWH.SYSTEM.sys_sales_daily
    group by ID_SUCURSAL, FECHA
    having count(*) > 1

)

select *
from validation_errors



  
  
      
    ) dbt_internal_test