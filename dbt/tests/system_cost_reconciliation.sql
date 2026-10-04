{{ config(tags=['system']) }}
select id_sucursal, mes_fecha from {{ ref('sys_branch_monthly') }}
where costos_disponibles and (
    abs(costo_op_total - costo_fijo - costo_variable) > 0.01
    or costo_productos_estimado is null or costo_productos_estimado < 0
)
