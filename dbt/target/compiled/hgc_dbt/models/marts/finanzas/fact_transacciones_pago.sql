

with pagos as (
    select * from HGC_DW.SILVER.stg_mariadb__transacciones_pago
),
pedidos as (
    select id_pedido_nk, id_sucursal, id_fecha, fecha_hora
    from HGC_DW.SILVER.stg_postgresql__pedidos
)
select
    coalesce(
        p.id_fecha,
        year(pago.fecha_pago)*10000 + month(pago.fecha_pago)*100 + day(pago.fecha_pago)
    )                                                    as id_fecha_sk,
    coalesce(
        hour(p.fecha_hora)*100  + minute(p.fecha_hora),
        hour(pago.fecha_pago)*100 + minute(pago.fecha_pago)
    )                                                    as id_hora_sk,
    p.id_sucursal                                        as id_sucursal_sk,
    pago.id_metodo                                       as id_metodo_sk,
    pago.id_pago_nk                                      as nro_pago_dd,
    pago.id_pedido                                       as nro_pedido_dd,
    pago.estado                                          as estado_confirmacion_dd,
    pago.monto                                           as monto_transaccion
from pagos pago
left join pedidos p on pago.id_pedido = p.id_pedido_nk