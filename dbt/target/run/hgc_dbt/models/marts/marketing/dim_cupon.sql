
  
    

create or replace transient table HGC_DW.GOLD.dim_cupon
    
    
    
    as (

with cupones as (
    select * from HGC_DW.SILVER.stg_mongodb__cupones
),
campanas as (
    select * from HGC_DW.SILVER.stg_mongodb__campanas
)
select
    row_number() over (order by c.id_cupon_nk)       as id_cupon_sk,
    c.id_cupon_nk,
    c.codigo                                         as codigo_cupon,
    c.tipo_descuento,
    c.valor                                          as valor_descuento_nominal,
    c.activo,
    coalesce(ca.nombre, 'Sin Campaña')               as nombre_campana,
    coalesce(ca.canal, 'Sin Canal')                  as canal_campana,
    ca.mes_inicio                                    as mes_inicio_campana,
    ca.dia_inicio                                    as dia_inicio_campana,
    ca.mes_fin                                       as mes_fin_campana,
    ca.dia_fin                                       as dia_fin_campana
from cupones c
left join campanas ca on c.id_campana = ca.id_campana_nk
    )
;


  