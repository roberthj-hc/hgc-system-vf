with source as (
    select * from HGC_DW.BRONZE_MONGODB.cupones
    where _ab_cdc_deleted_at is null
)
select
    cast(id_cupon as int)                 as id_cupon_nk,
    cast(id_campana as int)               as id_campana,
    codigo,
    tipo_descuento,
    valor,
    cast(activo as boolean)               as activo
from source