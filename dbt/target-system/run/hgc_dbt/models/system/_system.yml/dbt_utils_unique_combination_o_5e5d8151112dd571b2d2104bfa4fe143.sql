
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  





with validation_errors as (

    select
        ID_SUCURSAL, ID_PRODUCTO, SEMANA
    from HGC_DWH.SYSTEM.sys_product_weekly
    group by ID_SUCURSAL, ID_PRODUCTO, SEMANA
    having count(*) > 1

)

select *
from validation_errors



  
  
      
    ) dbt_internal_test