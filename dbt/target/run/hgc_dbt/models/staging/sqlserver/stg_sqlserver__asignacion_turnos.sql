
  create or replace   view HGC_DWH.SILVER.stg_sqlserver__asignacion_turnos
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_SQLSERVER.asignacion_turnos
)
select
    id_asignacion                         as id_asignacion_nk,
    id_empleado,
    id_turno,
    id_fecha,
    estado
from source
  );

