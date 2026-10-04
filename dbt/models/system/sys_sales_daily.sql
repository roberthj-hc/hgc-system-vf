{{ config(materialized='table', schema='SYSTEM', tags=['system']) }}

select fecha, id_sucursal, sucursal, ciudad, tipo_formato,
       sum(num_pedidos)::integer as pedidos,
       sum(ingresos_netos)::float as ingresos,
       sum(total_unidades_vendidas)::float as unidades
from {{ ref('int_ventas_diarias_sucursal') }}
where fecha <= {{ system_as_of() }}
group by 1,2,3,4,5
