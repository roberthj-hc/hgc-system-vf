

with source as (
    select distinct categoria, subcategoria
    from HGC_DWH.SILVER.stg_mariadb__costos_operativos
)
select
    row_number() over (order by categoria, subcategoria)  as id_categoria_costo_sk,
    categoria                                              as categoria_principal,
    subcategoria
from source