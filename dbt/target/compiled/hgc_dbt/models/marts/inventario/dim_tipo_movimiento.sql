

with tipos as (
    select distinct tipo_mov from HGC_DW.SILVER.stg_mysql__movimientos_inventario
)
select
    row_number() over (order by tipo_mov)  as id_tipo_mov_sk,
    tipo_mov                               as codigo_tipo_mov_nk,
    case tipo_mov
        when 'Entrada'       then 'Ingreso de insumos al almacén'
        when 'Salida'        then 'Egreso de insumos del almacén'
        when 'Ajuste'        then 'Ajuste de inventario'
        when 'Transferencia' then 'Transferencia entre almacenes'
        else tipo_mov
    end                                    as descripcion_movimiento
from tipos