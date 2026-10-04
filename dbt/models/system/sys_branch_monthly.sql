{{ config(materialized='table', schema='SYSTEM', tags=['system']) }}

select b.*, (b.costo_op_total is not null) as costos_disponibles, s.nombre as sucursal, s.ciudad, s.tipo_formato
from {{ ref('int_costos_ingresos_mes') }} b
left join {{ ref('stg_csv__sucursales') }} s on s.id_sucursal_nk = b.id_sucursal

where b.mes_fecha < date_trunc('month', {{ system_as_of() }})
