with source as (
    select * from HGC_DWH.BRONZE_MARIADB.metodos_pago
)
select
    id_metodo                             as id_metodo_nk,
    nombre
from source