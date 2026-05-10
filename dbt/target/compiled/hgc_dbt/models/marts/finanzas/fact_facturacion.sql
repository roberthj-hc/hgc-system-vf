

with facturas as (
    select * from HGC_DW.SILVER.stg_mariadb__facturas
),
pedidos as (
    select id_pedido_nk, id_sucursal, id_fecha
    from HGC_DW.SILVER.stg_postgresql__pedidos
)
select
    coalesce(
        p.id_fecha,
        year(f.fecha_emision)*10000 + month(f.fecha_emision)*100 + day(f.fecha_emision)
    )                                                    as id_fecha_emision_sk,
    p.id_sucursal                                        as id_sucursal_sk,
    f.id_factura_nk                                      as nro_factura_dd,
    f.id_pedido                                          as nro_pedido_dd,
    cast(f.nit_cliente as varchar)                       as nit_cliente_dd,
    f.razon_social                                       as razon_social_dd,
    cast(f.nro_autorizacion as varchar)                  as nro_autorizacion_fiscal_dd,
    f.codigo_control                                     as codigo_control_dd,
    f.monto_total                                        as monto_total_facturado,
    round(f.monto_total * 13.0 / 113.0, 2)              as monto_impuesto_fiscal
from facturas f
left join pedidos p on f.id_pedido = p.id_pedido_nk