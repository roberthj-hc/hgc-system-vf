
  
    

create or replace transient table HGC_DWH.SYSTEM.sys_customer_orders
    
    
    
    
    

    as (

select id_pedido_nk as id_pedido, id_cliente, id_sucursal,
       fecha_hora::date as fecha, total_neto::float as ingresos
from HGC_DWH.SILVER.stg_postgresql__pedidos
where id_estado = 1 and id_cliente is not null
  and fecha_hora::date <= to_date('2026-10-04')
  and fecha_hora::date > dateadd(day, -900, to_date('2026-10-04'))
    )
;


  