{{ config(materialized='table') }}

with almacenes as (
    select * from {{ ref('stg_mysql__almacenes') }}
),
sucursales as (
    select id_sucursal_sk, nombre_sucursal from {{ ref('dim_sucursal') }}
)
select
    a.id_almacen_nk                                      as id_almacen_sk,
    a.id_almacen_nk,
    a.nombre                                             as nombre_almacen,
    a.tipo                                               as tipo_almacen,
    coalesce(s.nombre_sucursal, 'Sin Sucursal')          as nombre_sucursal_asociada
from almacenes a
left join sucursales s on a.id_sucursal = s.id_sucursal_sk