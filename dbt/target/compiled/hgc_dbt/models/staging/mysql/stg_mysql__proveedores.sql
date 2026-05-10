with source as (
    select * from HGC_DW.BRONZE_MYSQL.proveedores
)
select
    id_proveedor                          as id_proveedor_nk,
    nombre,
    contacto,
    cast(telefono as varchar)             as telefono,
    ciudad_origen,
    estado
from source