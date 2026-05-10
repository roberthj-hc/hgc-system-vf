{{ config(materialized='table') }}

with minutos as (
    select (row_number() over (order by seq4()) - 1) as minuto_total
    from table(generator(rowcount => 1440))
)
select
    floor(minuto_total / 60) * 100 + mod(minuto_total, 60)  as id_hora_sk,
    floor(minuto_total / 60)::int                            as hora_24,
    mod(minuto_total, 60)::int                               as minuto,
    case
        when floor(minuto_total / 60) between 5  and 11 then 'Mañana'
        when floor(minuto_total / 60) between 12 and 17 then 'Tarde'
        when floor(minuto_total / 60) between 18 and 22 then 'Noche'
        else 'Madrugada'
    end                                                      as jornada
from minutos