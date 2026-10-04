
  create or replace   view HGC_DWH.SILVER.stg_sqlserver__departamentos
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_SQLSERVER.departamentos
)
select
    id_departamento                       as id_departamento_nk,
    nombre
from source
  );

