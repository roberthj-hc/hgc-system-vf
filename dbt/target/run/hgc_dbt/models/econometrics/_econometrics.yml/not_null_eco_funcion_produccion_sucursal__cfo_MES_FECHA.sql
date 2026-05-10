
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select MES_FECHA
from HGC_DW.ECONOMETRICS.eco_funcion_produccion_sucursal__cfo
where MES_FECHA is null



  
  
      
    ) dbt_internal_test