
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
select id_sucursal, fecha from HGC_DWH.SYSTEM.sys_sales_daily
where ingresos < 0 or pedidos < 0 or unidades < 0
  
  
      
    ) dbt_internal_test