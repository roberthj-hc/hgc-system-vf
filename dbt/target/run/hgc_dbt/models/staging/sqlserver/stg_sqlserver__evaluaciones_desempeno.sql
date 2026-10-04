
  create or replace   view HGC_DWH.SILVER.stg_sqlserver__evaluaciones_desempeno
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_SQLSERVER.evaluaciones_desempeno
)
select
    id_eval                               as id_eval_nk,
    id_empleado,
    puntaje,
    comentarios,
    cast(fecha as date)                   as fecha
from source
  );

