
      begin;
    merge into "HGC_DWH"."SNAPSHOTS"."SNP_MONGODB__CUPONES" as DBT_INTERNAL_DEST
    using "HGC_DWH"."SNAPSHOTS"."SNP_MONGODB__CUPONES__dbt_tmp" as DBT_INTERNAL_SOURCE
    on DBT_INTERNAL_SOURCE.dbt_scd_id = DBT_INTERNAL_DEST.dbt_scd_id

    when matched
     
       and DBT_INTERNAL_DEST.dbt_valid_to is null
     
     and DBT_INTERNAL_SOURCE.dbt_change_type in ('update', 'delete')
        then update
        set dbt_valid_to = DBT_INTERNAL_SOURCE.dbt_valid_to

    when not matched
     and DBT_INTERNAL_SOURCE.dbt_change_type = 'insert'
        then insert ("ID_CUPON_NK", "ID_CAMPANA", "CODIGO", "TIPO_DESCUENTO", "VALOR", "ACTIVO", "_AB_CDC_UPDATED_AT", "DBT_UPDATED_AT", "DBT_VALID_FROM", "DBT_VALID_TO", "DBT_SCD_ID")
        values ("ID_CUPON_NK", "ID_CAMPANA", "CODIGO", "TIPO_DESCUENTO", "VALOR", "ACTIVO", "_AB_CDC_UPDATED_AT", "DBT_UPDATED_AT", "DBT_VALID_FROM", "DBT_VALID_TO", "DBT_SCD_ID")

;
    commit;
  