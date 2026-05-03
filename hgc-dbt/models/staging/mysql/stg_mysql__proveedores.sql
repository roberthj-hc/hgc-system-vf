with source as (
    select * from {{ source('bronze_mysql', 'proveedores') }}
)
select
    id_proveedor                          as id_proveedor_nk,
    nombre,
    contacto,
    cast(telefono as varchar)             as telefono,
    ciudad_origen,
    estado
from source