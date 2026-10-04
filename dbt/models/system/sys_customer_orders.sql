{{ config(materialized='table', schema='SYSTEM', tags=['system']) }}

select id_pedido_nk as id_pedido, id_cliente, id_sucursal,
       fecha_hora::date as fecha, total_neto::float as ingresos
from {{ ref('stg_postgresql__pedidos') }}
where id_estado = 1 and id_cliente is not null
  and fecha_hora::date <= {{ system_as_of() }}
  and fecha_hora::date > dateadd(day, -900, {{ system_as_of() }})
