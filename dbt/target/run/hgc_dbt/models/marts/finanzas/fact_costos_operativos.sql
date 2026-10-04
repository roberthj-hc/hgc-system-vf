
  
    

create or replace transient table HGC_DWH.GOLD.fact_costos_operativos
    
    
    
    
    

    as (

with costos as (
    select * from HGC_DWH.SILVER.stg_mariadb__costos_operativos
),
dim_cat as (
    select id_categoria_costo_sk, categoria_principal, subcategoria
    from HGC_DWH.GOLD.dim_categoria_costo
)
select
    year(c.fecha_pago)*10000 + month(c.fecha_pago)*100 + day(c.fecha_pago)   as id_fecha_pago_sk,
    c.id_sucursal                                                              as id_sucursal_sk,
    dc.id_categoria_costo_sk,
    c.id_costo_nk                                                             as nro_costo_dd,
    coalesce(c.descripcion, '')                                               as descripcion_gasto_dd,
    c.monto                                                                   as monto_costo
from costos c
left join dim_cat dc on c.categoria   = dc.categoria_principal
                    and c.subcategoria = dc.subcategoria
    )
;


  