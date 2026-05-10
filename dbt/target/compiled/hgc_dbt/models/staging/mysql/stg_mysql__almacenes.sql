with source as (
    select * from HGC_DW.BRONZE_MYSQL.almacenes
)
select
    id_almacen                            as id_almacen_nk,
    id_sucursal,
    nombre,
    tipo
from source