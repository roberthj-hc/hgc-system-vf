
    
    

select
    ID_PEDIDO as unique_field,
    count(*) as n_records

from HGC_DWH.SYSTEM.sys_customer_orders
where ID_PEDIDO is not null
group by ID_PEDIDO
having count(*) > 1


