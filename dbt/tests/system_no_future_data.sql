{{ config(tags=['system']) }}
select id_sucursal, fecha from {{ ref('sys_sales_daily') }} where fecha > {{ system_as_of() }}
union all
select id_sucursal, fecha from {{ ref('sys_customer_orders') }} where fecha > {{ system_as_of() }}
