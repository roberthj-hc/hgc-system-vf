
      
  
    

create or replace transient table HGC_DW.snapshots.snp_sqlserver__empleados
    
    
    
    as (
    

    select *,
        md5(coalesce(cast(id_empleado_nk as varchar ), '')
         || '|' || coalesce(cast(to_timestamp_ntz(convert_timezone('UTC', current_timestamp())) as varchar ), '')
        ) as dbt_scd_id,
        to_timestamp_ntz(convert_timezone('UTC', current_timestamp())) as dbt_updated_at,
        to_timestamp_ntz(convert_timezone('UTC', current_timestamp())) as dbt_valid_from,
        
  
  coalesce(nullif(to_timestamp_ntz(convert_timezone('UTC', current_timestamp())), to_timestamp_ntz(convert_timezone('UTC', current_timestamp()))), null)
  as dbt_valid_to
from (
        



with source as (
    select * from HGC_DW.BRONZE_SQLSERVER.empleados
)
select
    id_empleado                           as id_empleado_nk,
    id_sucursal,
    id_cargo,
    nombre,
    tipo_contrato,
    cast(documento_identidad as varchar)  as documento_identidad,
    cast(telefono as varchar)             as telefono,
    salario_base,
    estado,
    cast(fecha_ingreso as date)           as fecha_ingreso
from source

    ) sbq



    )
;


  
  