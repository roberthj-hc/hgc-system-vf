{% macro system_as_of() -%}
    to_date('{{ var("system_as_of", run_started_at.astimezone(modules.pytz.timezone("America/La_Paz")).strftime("%Y-%m-%d")) }}')
{%- endmacro %}
