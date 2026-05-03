{{ config(materialized='table') }}

with source as (select * from {{ ref('stg_sqlserver__turnos') }})
select
    id_turno_nk   as id_turno_sk,
    id_turno_nk,
    nombre        as nombre_turno,
    hora_inicio   as hora_inicio_estandar,
    hora_fin      as hora_fin_estandar,
    tipo          as tipo_turno
from source