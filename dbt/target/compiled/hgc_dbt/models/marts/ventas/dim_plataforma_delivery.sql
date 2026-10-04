

with source as (select * from HGC_DWH.SILVER.stg_postgresql__plataformas_delivery)
select
    id_plataforma_nk  as id_plataforma_sk,
    id_plataforma_nk,
    nombre            as nombre_plataforma
from source