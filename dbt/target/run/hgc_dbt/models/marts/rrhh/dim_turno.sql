
  
    

create or replace transient table HGC_DW.GOLD.dim_turno
    
    
    
    as (

with source as (select * from HGC_DW.SILVER.stg_sqlserver__turnos)
select
    id_turno_nk   as id_turno_sk,
    id_turno_nk,
    nombre        as nombre_turno,
    hora_inicio   as hora_inicio_estandar,
    hora_fin      as hora_fin_estandar,
    tipo          as tipo_turno
from source
    )
;


  