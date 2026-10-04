
  
    

create or replace transient table HGC_DWH.SYSTEM.sys_branch_monthly
    
    
    
    
    

    as (

select b.*, s.nombre as sucursal, s.ciudad, s.tipo_formato
from HGC_DWH.ECONOMETRICS.int_costos_ingresos_mes b
left join HGC_DWH.SILVER.stg_csv__sucursales s on s.id_sucursal_nk = b.id_sucursal
    )
;


  