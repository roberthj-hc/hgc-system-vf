{{ config(materialized='table') }}

with source as (select * from {{ ref('stg_postgresql__canales_venta') }})
select
    id_canal_nk  as id_canal_sk,
    id_canal_nk,
    nombre       as nombre_canal
from source