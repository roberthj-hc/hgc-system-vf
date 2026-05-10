
  create or replace   view HGC_DW.SILVER.stg_sqlserver__asignacion_turnos
  
  
  
  
  as (
    with source as (
    select * from HGC_DW.BRONZE_SQLSERVER.asignacion_turnos
)
select
    id_asignacion                         as id_asignacion_nk,
    id_empleado,
    id_turno,
    id_fecha,
    estado
from source
  );

