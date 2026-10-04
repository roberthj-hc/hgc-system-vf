
      begin;
    merge into "HGC_DWH"."SNAPSHOTS"."SNP_SQLSERVER__EMPLEADOS" as DBT_INTERNAL_DEST
    using "HGC_DWH"."SNAPSHOTS"."SNP_SQLSERVER__EMPLEADOS__dbt_tmp" as DBT_INTERNAL_SOURCE
    on DBT_INTERNAL_SOURCE.dbt_scd_id = DBT_INTERNAL_DEST.dbt_scd_id

    when matched
     
       and DBT_INTERNAL_DEST.dbt_valid_to is null
     
     and DBT_INTERNAL_SOURCE.dbt_change_type in ('update', 'delete')
        then update
        set dbt_valid_to = DBT_INTERNAL_SOURCE.dbt_valid_to

    when not matched
     and DBT_INTERNAL_SOURCE.dbt_change_type = 'insert'
        then insert ("ID_EMPLEADO_NK", "ID_SUCURSAL", "ID_CARGO", "NOMBRE", "TIPO_CONTRATO", "DOCUMENTO_IDENTIDAD", "TELEFONO", "SALARIO_BASE", "ESTADO", "FECHA_INGRESO", "DBT_UPDATED_AT", "DBT_VALID_FROM", "DBT_VALID_TO", "DBT_SCD_ID")
        values ("ID_EMPLEADO_NK", "ID_SUCURSAL", "ID_CARGO", "NOMBRE", "TIPO_CONTRATO", "DOCUMENTO_IDENTIDAD", "TELEFONO", "SALARIO_BASE", "ESTADO", "FECHA_INGRESO", "DBT_UPDATED_AT", "DBT_VALID_FROM", "DBT_VALID_TO", "DBT_SCD_ID")

;
    commit;
  