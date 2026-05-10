
  
    

create or replace transient table HGC_DW.GOLD.dim_cliente
    
    
    
    as (

with snap as (
    select * from HGC_DW.snapshots.snp_mongodb__clientes
)
select
    row_number() over (order by id_cliente_nk, dbt_valid_from)              as id_cliente_sk,
    id_cliente_nk,
    nombre                                                                   as nombre_completo,
    celular,
    email,
    genero,
    segmento,
    case
        when fecha_nacimiento is null                                        then 'No informado'
        when datediff('year', fecha_nacimiento, current_date()) < 18        then 'Menor de 18'
        when datediff('year', fecha_nacimiento, current_date()) < 26        then '18-25'
        when datediff('year', fecha_nacimiento, current_date()) < 36        then '26-35'
        when datediff('year', fecha_nacimiento, current_date()) < 46        then '36-45'
        when datediff('year', fecha_nacimiento, current_date()) < 56        then '46-55'
        else '56+'
    end                                                                      as rango_edad,
    cast(dbt_valid_from as timestamp)                                        as valido_desde,
    cast(coalesce(dbt_valid_to, '9999-12-31 23:59:59') as timestamp)        as valido_hasta,
    dbt_valid_to is null                                                     as es_actual
from snap
    )
;


  