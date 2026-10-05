{{ config(tags=['system']) }}
select id_cliente, cutoff from {{ ref('sys_customer_features') }}
where recency < 0 or recency >= 180 or frequency <= 0 or monetary < 0
   or registration_age < 0 or cutoff > {{ system_as_of() }}
   or (dateadd(day,90,cutoff) > {{ system_as_of() }} and (spend_90d is not null or inactive_90d is not null))
   or (dateadd(day,90,cutoff) <= {{ system_as_of() }} and (spend_90d is null or inactive_90d is null))
