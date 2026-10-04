{{ config(tags=['system']) }}
select id_sucursal, fecha from {{ ref('sys_sales_daily') }}
where ingresos < 0 or pedidos < 0 or unidades < 0
