{{ config(materialized='table', schema='SYSTEM', tags=['system']) }}

select b.*, s.nombre as sucursal, s.ciudad, s.tipo_formato
from {{ ref('int_costos_ingresos_mes') }} b
left join {{ ref('stg_csv__sucursales') }} s on s.id_sucursal_nk = b.id_sucursal
