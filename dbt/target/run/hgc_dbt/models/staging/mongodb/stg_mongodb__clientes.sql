
  create or replace   view HGC_DWH.SILVER.stg_mongodb__clientes
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_MONGODB.clientes
    where _ab_cdc_deleted_at is null
)
select
    cast(id_cliente as int)               as id_cliente_nk,
    nombre,
    email,
    genero,
    segmento,
    cast(celular as varchar)              as celular,
    cast(documento_identidad as bigint)   as documento_identidad,
    cast(fecha_nacimiento as date)        as fecha_nacimiento,
    cast(fecha_registro as timestamp)     as fecha_registro
from source
  );

