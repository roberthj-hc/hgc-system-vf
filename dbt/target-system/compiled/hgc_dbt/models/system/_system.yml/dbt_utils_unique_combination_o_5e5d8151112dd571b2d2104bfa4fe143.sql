





with validation_errors as (

    select
        ID_SUCURSAL, ID_PRODUCTO, SEMANA
    from HGC_DWH.SYSTEM.sys_product_weekly
    group by ID_SUCURSAL, ID_PRODUCTO, SEMANA
    having count(*) > 1

)

select *
from validation_errors


