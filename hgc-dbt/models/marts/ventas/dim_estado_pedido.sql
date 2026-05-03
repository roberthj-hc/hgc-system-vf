{{ config(materialized='table') }}

with source as (select * from {{ ref('stg_postgresql__estado_pedido') }})
select
    id_estado_nk  as id_estado_sk,
    id_estado_nk,
    nombre        as nombre_estado
from source