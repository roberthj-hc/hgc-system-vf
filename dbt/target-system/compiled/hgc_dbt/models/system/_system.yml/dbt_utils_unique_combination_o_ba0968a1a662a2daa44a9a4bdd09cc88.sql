





with validation_errors as (

    select
        ID_SUCURSAL, FECHA
    from HGC_DWH.SYSTEM.sys_sales_daily
    group by ID_SUCURSAL, FECHA
    having count(*) > 1

)

select *
from validation_errors


