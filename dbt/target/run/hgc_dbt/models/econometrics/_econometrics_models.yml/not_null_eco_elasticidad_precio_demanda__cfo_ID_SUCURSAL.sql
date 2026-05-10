
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select ID_SUCURSAL
from HGC_DW.ECONOMETRICS.eco_elasticidad_precio_demanda__cfo
where ID_SUCURSAL is null



  
  
      
    ) dbt_internal_test