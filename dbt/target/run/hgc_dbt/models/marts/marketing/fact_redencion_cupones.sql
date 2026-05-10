
  
    

create or replace transient table HGC_DW.GOLD.fact_redencion_cupones
    
    
    
    as (

with redimidos as (
    select * from HGC_DW.SILVER.stg_mongodb__cupones_redimidos
),
pedidos as (
    select id_pedido_nk, id_fecha, id_cliente, id_sucursal, total_neto
    from HGC_DW.SILVER.stg_postgresql__pedidos
),
dim_cupon as (
    select id_cupon_sk, id_cupon_nk from HGC_DW.GOLD.dim_cupon
),
dim_cliente as (
    select id_cliente_sk, id_cliente_nk
    from HGC_DW.GOLD.dim_cliente
    where es_actual = true
)
select
    p.id_fecha                               as id_fecha_redencion_sk,
    p.id_sucursal                            as id_sucursal_sk,
    dc.id_cliente_sk,
    cu.id_cupon_sk,
    r.id_redencion_nk                        as nro_redencion_dd,
    r.id_pedido                              as nro_pedido_asociado_dd,
    coalesce(r.monto_descuento, 0)           as monto_descuento_real_otorgado,
    coalesce(p.total_neto, 0)                as monto_ticket_asociado,
    1                                        as indicador_redencion
from redimidos r
inner join pedidos p    on r.id_pedido  = p.id_pedido_nk
left join dim_cliente dc on p.id_cliente = dc.id_cliente_nk
left join dim_cupon cu   on r.id_cupon   = cu.id_cupon_nk
    )
;


  