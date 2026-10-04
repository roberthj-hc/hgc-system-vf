
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select ID_PEDIDO
from HGC_DWH.SYSTEM.sys_customer_orders
where ID_PEDIDO is null



  
  
      
    ) dbt_internal_test