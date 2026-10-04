
  
    

create or replace transient table HGC_DWH.GOLD.dim_producto
    
    
    
    
    

    as (

with snap as (
    select * from HGC_DWH.snapshots.snp_postgresql__productos
),
categorias as (
    select id_categoria_nk, nombre from HGC_DWH.SILVER.stg_postgresql__categoria_producto
)
select
    row_number() over (order by s.id_producto_nk, s.dbt_valid_from)         as id_producto_sk,
    s.id_producto_nk,
    s.nombre                                                                 as nombre_producto,
    coalesce(c.nombre, 'Sin Categoría')                                     as categoria_nombre,
    s.tipo                                                                   as tipo_producto,
    s.precio_base                                                            as precio_base_historico,
    s.costo_estandar                                                         as costo_estandar_historico,
    s.activo,
    cast(s.dbt_valid_from as timestamp)                                      as valido_desde,
    cast(coalesce(s.dbt_valid_to, '9999-12-31 23:59:59') as timestamp)      as valido_hasta,
    s.dbt_valid_to is null                                                   as es_actual
from snap s
left join categorias c on s.id_categoria = c.id_categoria_nk
    )
;


  