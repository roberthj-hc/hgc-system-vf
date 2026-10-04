with source as (
    select * from HGC_DWH.BRONZE_SQLSERVER.cargos
)
select
    id_cargo                              as id_cargo_nk,
    id_departamento,
    nombre
from source