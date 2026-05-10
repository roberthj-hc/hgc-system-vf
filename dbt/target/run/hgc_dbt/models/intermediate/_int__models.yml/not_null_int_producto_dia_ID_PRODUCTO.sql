
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select ID_PRODUCTO
from HGC_DW.ECONOMETRICS.int_producto_dia
where ID_PRODUCTO is null



  
  
      
    ) dbt_internal_test