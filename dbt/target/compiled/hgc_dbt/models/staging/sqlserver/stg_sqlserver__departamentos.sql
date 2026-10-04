with source as (
    select * from HGC_DWH.BRONZE_SQLSERVER.departamentos
)
select
    id_departamento                       as id_departamento_nk,
    nombre
from source