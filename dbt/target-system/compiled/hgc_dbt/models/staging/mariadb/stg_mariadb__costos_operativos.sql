with source as (
    select * from HGC_DWH.BRONZE_MARIADB.costos_operativos
)
select
    id_costo                              as id_costo_nk,
    id_sucursal,
    categoria,
    subcategoria,
    descripcion,
    monto,
    cast(fecha_pago as date)              as fecha_pago
from source