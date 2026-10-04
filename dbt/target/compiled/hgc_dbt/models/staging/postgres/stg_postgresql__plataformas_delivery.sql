with source as (
    select * from HGC_DWH.BRONZE_POSTGRESQL.plataformas_delivery
)
select
    id_plataforma                         as id_plataforma_nk,
    nombre
from source