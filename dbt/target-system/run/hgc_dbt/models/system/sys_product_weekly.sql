
  
    

create or replace transient table HGC_DWH.SYSTEM.sys_product_weekly
    
    
    
    
    

    as (

select v.*, p.nombre as producto, p.costo_estandar,
       s.nombre as sucursal, s.ciudad
from HGC_DWH.ECONOMETRICS.int_ventas_producto_semana v
left join HGC_DWH.SILVER.stg_postgresql__productos p on p.id_producto_nk = v.id_producto
left join HGC_DWH.SILVER.stg_csv__sucursales s on s.id_sucursal_nk = v.id_sucursal
    )
;


  