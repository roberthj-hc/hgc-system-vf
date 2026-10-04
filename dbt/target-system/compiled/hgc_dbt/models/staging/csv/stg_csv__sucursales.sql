with source as (
    select * from HGC_DWH.BRONZE_CSV_EXCEL.sucursales
)
select
    cast(id_sucursal as int)              as id_sucursal_nk,
    nombre,
    tipo_formato,
    ciudad,
    estado,
    direccion,
    cast(telefono as varchar)             as telefono,
    gerente,
    cast(fecha_apertura as date)          as fecha_apertura,
    cast(created_at as timestamp)         as created_at
from source