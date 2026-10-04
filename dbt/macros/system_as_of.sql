{% macro system_as_of() -%}
    to_date('{{ var("system_as_of", run_started_at.strftime("%Y-%m-%d")) }}')
{%- endmacro %}
