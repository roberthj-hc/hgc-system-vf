{{ config(materialized='table') }}

with source as (select * from {{ ref('stg_postgresql__plataformas_delivery') }})
select
    id_plataforma_nk  as id_plataforma_sk,
    id_plataforma_nk,
    nombre            as nombre_plataforma
from source