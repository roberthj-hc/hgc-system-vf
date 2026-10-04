
  
    

create or replace transient table HGC_DWH.SYSTEM.sys_sales_daily
    
    
    
    
    

    as (

select fecha, id_sucursal, sucursal, ciudad, tipo_formato,
       sum(num_pedidos)::integer as pedidos,
       sum(ingresos_netos)::float as ingresos,
       sum(total_unidades_vendidas)::float as unidades
from HGC_DWH.FEATURES.int_ventas_diarias_sucursal
group by 1,2,3,4,5
    )
;


  