{{ config(materialized='table', schema='SYSTEM', tags=['system']) }}

select v.*, p.nombre as producto, p.costo_estandar,
       s.nombre as sucursal, s.ciudad
from {{ ref('int_ventas_producto_semana') }} v
left join {{ ref('stg_postgresql__productos') }} p on p.id_producto_nk = v.id_producto
left join {{ ref('stg_csv__sucursales') }} s on s.id_sucursal_nk = v.id_sucursal
