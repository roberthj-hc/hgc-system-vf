
  create or replace   view HGC_DW.SILVER.stg_postgresql__plataformas_delivery
  
  
  
  
  as (
    with source as (
    select * from HGC_DW.BRONZE_POSTGRESQL.plataformas_delivery
)
select
    id_plataforma                         as id_plataforma_nk,
    nombre
from source
  );

