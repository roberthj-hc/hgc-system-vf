
  create or replace   view HGC_DWH.SILVER.stg_sqlserver__empleados
  
  
  
  
  as (
    with source as (
    select * from HGC_DWH.BRONZE_SQLSERVER.empleados
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
  );

