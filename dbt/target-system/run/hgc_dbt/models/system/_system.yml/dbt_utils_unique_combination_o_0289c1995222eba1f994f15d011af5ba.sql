
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  





with validation_errors as (

    select
        ID_SUCURSAL, MES_FECHA
    from HGC_DWH.SYSTEM.sys_branch_monthly
    group by ID_SUCURSAL, MES_FECHA
    having count(*) > 1

)

select *
from validation_errors



  
  
      
    ) dbt_internal_test