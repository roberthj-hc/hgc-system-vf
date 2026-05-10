

with source as (
    select * from HGC_DW.SILVER.stg_csv__sucursales
)
select
    id_sucursal_nk                                       as id_sucursal_sk,
    id_sucursal_nk,
    nombre                                               as nombre_sucursal,
    ciudad,
    direccion,
    tipo_formato,
    fecha_apertura,
    estado                                               as estado_sucursal,
    gerente                                              as nombre_gerente,
    coalesce(fecha_apertura, cast('2000-01-01' as date)) as valido_desde,
    cast('9999-12-31' as date)                           as valido_hasta,
    true                                                 as es_actual
from source