
  create or replace   view HGC_DWH.SILVER.stg_sqlserver__asistencia
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_SQLSERVER.asistencia
)
select
    id_asistencia                         as id_asistencia_nk,
    id_empleado,
    id_fecha,
    cast(hora_entrada as time)            as hora_entrada,
    cast(hora_salida as time)             as hora_salida,
    minutos_atraso
from source
  );

