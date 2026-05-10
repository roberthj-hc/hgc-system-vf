
  
    

create or replace transient table HGC_DW.ECONOMETRICS.int_sucursal_mes
    
    
    
    as (

WITH ventas_mes AS (
    SELECT
        DATE_TRUNC('MONTH', DATE(p.FECHA_HORA)) AS MES_FECHA,
        p.ID_SUCURSAL,
        SUM(p.TOTAL_NETO)                       AS VENTAS,
        SUM(p.TOTAL_BRUTO - p.TOTAL_NETO)       AS DESCUENTOS,
        COUNT(*)                                AS NUM_PEDIDOS
    FROM HGC_DW.SILVER.stg_postgresql__pedidos p
    JOIN HGC_DW.SILVER.stg_postgresql__estado_pedido ep
        ON p.ID_ESTADO = ep.ID_ESTADO_NK
    WHERE LOWER(ep.NOMBRE) NOT IN ('cancelado','anulado')
    GROUP BY 1,2
),

meses AS ( SELECT DISTINCT MES_FECHA FROM ventas_mes ),

costo_personal AS (
    -- proxy: salario base de empleados activos a fin de mes
    SELECT
        m.MES_FECHA,
        e.ID_SUCURSAL,
        SUM(e.SALARIO_BASE) AS COSTO_PERSONAL
    FROM meses m
    JOIN HGC_DW.SILVER.stg_sqlserver__empleados e
        ON e.FECHA_INGRESO <= LAST_DAY(m.MES_FECHA)
    WHERE e.ESTADO = 'Activo'
    GROUP BY 1,2
),

costo_insumos AS (
    -- consumo de insumos vía movimientos de inventario
    SELECT
        DATE_TRUNC('MONTH', mv.FECHA_HORA) AS MES_FECHA,
        al.ID_SUCURSAL,
        SUM(ABS(mv.CANTIDAD) * mv.COSTO_UNITARIO) AS COSTO_INSUMOS
    FROM HGC_DW.SILVER.stg_mysql__movimientos_inventario mv
    JOIN HGC_DW.SILVER.stg_mysql__almacenes al
        ON mv.ID_ALMACEN = al.ID_ALMACEN_NK
    WHERE mv.TIPO_MOV IN ('SALIDA','CONSUMO','VENTA')
    GROUP BY 1,2
),

costo_op AS (
    SELECT
        DATE_TRUNC('MONTH', co.FECHA_PAGO) AS MES_FECHA,
        co.ID_SUCURSAL,
        SUM(CASE WHEN co.CATEGORIA='Alquiler'
                 THEN co.MONTO ELSE 0 END)        AS COSTO_ALQUILER,
        SUM(CASE WHEN co.CATEGORIA='Servicios Básicos'
                 THEN co.MONTO ELSE 0 END)        AS COSTO_SERVICIOS,
        SUM(co.MONTO)                             AS COSTO_OPERATIVO_FIJO
    FROM HGC_DW.SILVER.stg_mariadb__costos_operativos co
    GROUP BY 1,2
),

n_sucursales AS ( SELECT COUNT(*) AS N FROM HGC_DW.SILVER.stg_csv__sucursales ),

-- presupuesto de marketing prorrateado (no hay año en CAMPANAS, asumimos vigente)
mkt_mes AS (
    SELECT
        DATE_FROM_PARTS( EXTRACT(YEAR FROM CURRENT_DATE()), MES_INICIO, 1 ) AS MES_FECHA,
        SUM(PRESUPUESTO) AS PRESUPUESTO_GLOBAL
    FROM HGC_DW.SILVER.stg_mongodb__campanas
    GROUP BY 1
)

SELECT
    vm.MES_FECHA,
    vm.ID_SUCURSAL,
    s.NOMBRE                                              AS SUCURSAL,
    s.CIUDAD,
    s.TIPO_FORMATO,
    s.FECHA_APERTURA,
    DATEDIFF('MONTH', s.FECHA_APERTURA, vm.MES_FECHA)     AS ANTIGUEDAD_MESES,
    vm.VENTAS,
    vm.NUM_PEDIDOS,
    vm.DESCUENTOS,
    COALESCE(cp.COSTO_PERSONAL, 0)                        AS COSTO_PERSONAL,
    COALESCE(ci.COSTO_INSUMOS,  0)                        AS COSTO_INSUMOS,
    COALESCE(co.COSTO_ALQUILER, 0)                        AS COSTO_ALQUILER,
    COALESCE(co.COSTO_SERVICIOS,0)                        AS COSTO_SERVICIOS,
    COALESCE(co.COSTO_OPERATIVO_FIJO, 0)                  AS COSTO_OPERATIVO_FIJO,
    COALESCE(mkt.PRESUPUESTO_GLOBAL, 0)
        / NULLIF((SELECT N FROM n_sucursales), 0)         AS COSTO_MARKETING,
    vm.VENTAS
        - COALESCE(cp.COSTO_PERSONAL,0)
        - COALESCE(ci.COSTO_INSUMOS,0)
        - COALESCE(co.COSTO_OPERATIVO_FIJO,0)             AS MARGEN_OPERATIVO
FROM ventas_mes vm
LEFT JOIN HGC_DW.SILVER.stg_csv__sucursales s
    ON vm.ID_SUCURSAL = s.ID_SUCURSAL_NK
LEFT JOIN costo_personal cp
    ON vm.MES_FECHA = cp.MES_FECHA AND vm.ID_SUCURSAL = cp.ID_SUCURSAL
LEFT JOIN costo_insumos ci
    ON vm.MES_FECHA = ci.MES_FECHA AND vm.ID_SUCURSAL = ci.ID_SUCURSAL
LEFT JOIN costo_op co
    ON vm.MES_FECHA = co.MES_FECHA AND vm.ID_SUCURSAL = co.ID_SUCURSAL
LEFT JOIN mkt_mes mkt
    ON vm.MES_FECHA = mkt.MES_FECHA
    )
;


  