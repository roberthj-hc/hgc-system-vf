{{ config(materialized='table', schema='SYSTEM', tags=['system']) }}

-- Eight point-in-time cohorts. Only mature future windows have labels.
with cutoffs as (
    select dateadd(day, -column1, {{ system_as_of() }})::date as cutoff
    from values (0), (90), (180), (270), (360), (450), (540), (630)
),
orders as (select * from {{ ref('sys_customer_orders') }}),
rfm as (
    select o.id_cliente, c.cutoff,
        datediff(day, max(case when o.fecha <= c.cutoff then o.fecha end), c.cutoff) as recency,
        count_if(o.fecha <= c.cutoff) as frequency,
        sum(case when o.fecha <= c.cutoff then o.ingresos else 0 end)::float as monetary,
        datediff(day, min(case when o.fecha <= c.cutoff then o.fecha end), c.cutoff) as tenure,
        max_by(case when o.fecha <= c.cutoff then o.id_sucursal end,
            case when o.fecha <= c.cutoff then to_char(o.fecha, 'YYYYMMDD') || lpad(o.id_pedido::varchar, 20, '0') end) as id_sucursal,
        case when dateadd(day,90,c.cutoff) <= {{ system_as_of() }} then
            sum(case when o.fecha > c.cutoff then o.ingresos else 0 end)::float end as spend_90d,
        case when dateadd(day,90,c.cutoff) <= {{ system_as_of() }} then
            iff(count_if(o.fecha > c.cutoff) = 0,1,0) end as inactive_90d
    from cutoffs c
    join orders o on o.fecha > dateadd(day,-180,c.cutoff) and o.fecha <= dateadd(day,90,c.cutoff)
    group by o.id_cliente,c.cutoff
    having count_if(o.fecha <= c.cutoff) > 0
),
crm as (
    -- No names, emails, identity documents or phone numbers enter serving/ML.
    select id_cliente_nk, fecha_registro::date as registered_at
    from {{ ref('stg_mongodb__clientes') }}
)
select r.*, r.monetary / nullif(r.frequency,0) as ticket,
    case when crm.registered_at <= r.cutoff then datediff(day,crm.registered_at,r.cutoff) else 0 end as registration_age,
    (crm.registered_at <= r.cutoff) as crm_available
from rfm r
left join crm on crm.id_cliente_nk = r.id_cliente
