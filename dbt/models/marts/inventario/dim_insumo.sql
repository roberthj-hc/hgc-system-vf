{{ config(materialized='table') }}

with source as (select * from {{ ref('stg_mysql__insumos') }})
select
    id_insumo_nk                       as id_insumo_sk,
    id_insumo_nk,
    nombre                             as nombre_insumo,
    unidad_medida,
    costo_unitario                     as costo_unitario_historico,
    activo,
    cast('2000-01-01' as date)         as valido_desde,
    cast('9999-12-31' as date)         as valido_hasta,
    true                               as es_actual
from source